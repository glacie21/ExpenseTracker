import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTransactionFilter } from "@/lib/transactions";
import { CSV_BOM, CsvColumn, csvHeader, csvRows } from "@/lib/csv";
import { toDateOnlyString } from "@/lib/dates";

const BATCH_SIZE = 1000;
const MAX_EXPORT_ROWS = 100_000;

interface ExportRow {
  date: Date;
  title: string;
  type: string;
  amount: { toFixed: (digits: number) => string };
  description: string | null;
  category: { name: string };
}

const COLUMNS: CsvColumn<ExportRow>[] = [
  { header: "Tanggal", value: (r) => toDateOnlyString(r.date), trusted: true },
  { header: "Judul", value: (r) => r.title },
  { header: "Tipe", value: (r) => r.type, trusted: true },
  { header: "Kategori", value: (r) => r.category.name },
  // Plain decimal with a dot (e.g. 5000000.00) so spreadsheets parse it as a number
  { header: "Nominal", value: (r) => r.amount.toFixed(2), trusted: true },
  { header: "Deskripsi", value: (r) => r.description },
];

/**
 * GET /api/transactions/export
 * Unduh transaksi pengguna yang login sebagai CSV (UTF-8), mengikuti filter
 * yang sama dengan GET /api/transactions.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Sesi tidak valid atau telah berakhir." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filter = buildTransactionFilter(user.id, searchParams);
    if (!filter.ok) {
      return NextResponse.json({ success: false, message: filter.message }, { status: 400 });
    }

    const total = await prisma.transaction.count({ where: filter.where });
    if (total === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada transaksi yang sesuai filter untuk diekspor." },
        { status: 404 }
      );
    }
    if (total > MAX_EXPORT_ROWS) {
      return NextResponse.json(
        {
          success: false,
          message: `Terlalu banyak transaksi (${total}). Persempit filter hingga maksimal ${MAX_EXPORT_ROWS} baris.`,
        },
        { status: 400 }
      );
    }

    // Ambil per batch agar memori tetap kecil untuk data besar
    let csv = CSV_BOM + csvHeader(COLUMNS);
    for (let skip = 0; skip < total; skip += BATCH_SIZE) {
      const batch = await prisma.transaction.findMany({
        where: filter.where,
        select: {
          date: true,
          title: true,
          type: true,
          amount: true,
          description: true,
          category: { select: { name: true } },
        },
        orderBy: [{ date: filter.sort }, { createdAt: filter.sort }, { id: filter.sort }],
        skip,
        take: BATCH_SIZE,
      });
      csv += csvRows(COLUMNS, batch);
    }

    const today = toDateOnlyString(new Date());
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transaksi-${today}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/transactions/export error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengekspor transaksi." },
      { status: 500 }
    );
  }
}
