import { NextRequest, NextResponse } from "next/server";
import { UNAUTHORIZED } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { CSV_BOM } from "@/lib/csv";
import { isUnsupportedCharacterError, unsupportedCharacterResponse } from "@/lib/dbErrors";
import {
  executeTransactionsImport,
  parseTransactionsCsv,
} from "@/lib/transactionsImport";
import { TRANSACTION_CSV_HEADERS } from "@/lib/transactionsImportUtils";

/**
 * GET /api/transactions/import
 * Mengunduh contoh template file CSV yang siap diisi oleh pengguna.
 */
export async function GET() {
  const templateCsv =
    CSV_BOM +
    Object.values(TRANSACTION_CSV_HEADERS).join(",") + "\r\n" +
    "2026-10-01,Gaji Bulanan,INCOME,Gaji,8500000,Gaji bulan Oktober\r\n" +
    "2026-10-02,Makan Siang Resto,EXPENSE,Makan & Minum,65000,Makan siang bersama tim\r\n" +
    "2026-10-03,Bensin Motor,EXPENSE,Transportasi,30000,Isi bensin pertalite\r\n";

  return new Response(templateCsv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="template-transaksi.csv"',
      "Cache-Control": "no-store",
    },
  });
}

/**
 * POST /api/transactions/import
 * Memvalidasi (dry-run) atau mengeksekusi impor massal transaksi dari CSV.
 * Body: { csvContent: string, dryRun?: boolean, skipErrors?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.csvContent !== "string") {
      return NextResponse.json(
        { success: false, message: "Konten file CSV tidak ditemukan atau tidak valid." },
        { status: 400 }
      );
    }

    const dryRun = body.dryRun === true;
    const skipErrors = body.skipErrors === true;

    const parseResult = await parseTransactionsCsv(body.csvContent, user.id);
    if (parseResult.error !== undefined) {
      return NextResponse.json({ success: false, message: parseResult.error }, { status: 400 });
    }

    const { data: previewData, validRows } = parseResult;

    // Mode preview / dryRun: kembalikan rangkuman tanpa menyimpan ke database
    if (dryRun) {
      return NextResponse.json({
        success: true,
        message: "File CSV berhasil diverifikasi.",
        data: previewData,
      });
    }

    // Mode eksekusi impor
    if (validRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Tidak ada baris transaksi valid yang dapat diimpor.",
          data: previewData,
        },
        { status: 400 }
      );
    }

    if (previewData.errorCount > 0 && !skipErrors) {
      return NextResponse.json(
        {
          success: false,
          message: `Ditemukan ${previewData.errorCount} baris bermasalah. Aktifkan opsi lewati baris bermasalah untuk melanjutkan impor.`,
          data: previewData,
        },
        { status: 400 }
      );
    }

    const { importedCount, createdCategoriesCount } = await executeTransactionsImport(
      validRows,
      user.id
    );

    const skippedCount = previewData.errorCount;
    let message = `Berhasil mengimpor ${importedCount} transaksi.`;
    if (createdCategoriesCount > 0) {
      message += ` (${createdCategoriesCount} kategori baru otomatis dibuat)`;
    }
    if (skippedCount > 0) {
      message += ` (${skippedCount} baris tidak valid dilewati).`;
    }

    return NextResponse.json({
      success: true,
      message,
      data: {
        importedCount,
        createdCategoriesCount,
        skippedCount,
      },
    });
  } catch (error) {
    if (isUnsupportedCharacterError(error)) return unsupportedCharacterResponse();
    console.error("POST /api/transactions/import error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat mengimpor transaksi." },
      { status: 500 }
    );
  }
}

