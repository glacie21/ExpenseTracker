import { NextRequest, NextResponse } from "next/server";
import { UNAUTHORIZED } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isUnsupportedCharacterError, unsupportedCharacterResponse } from "@/lib/dbErrors";
import { ExportedTransaction, buildTransactionFilter, transactionExportBatches } from "@/lib/transactions";
import { CSV_BOM, CsvColumn, csvHeader, csvRows } from "@/lib/csv";
import { toDateOnlyString } from "@/lib/dates";
import { TRANSACTION_CSV_HEADERS } from "@/lib/transactionsImportUtils";

const MAX_EXPORT_ROWS = 100_000;

const COLUMNS: CsvColumn<ExportedTransaction>[] = [
  { header: TRANSACTION_CSV_HEADERS.date, value: (r) => toDateOnlyString(r.date), trusted: true },
  { header: TRANSACTION_CSV_HEADERS.title, value: (r) => r.title },
  { header: TRANSACTION_CSV_HEADERS.type, value: (r) => r.type, trusted: true },
  { header: TRANSACTION_CSV_HEADERS.category, value: (r) => r.category.name },
  // Plain decimal with a dot (e.g. 5000000.00) so spreadsheets parse it as a number
  { header: TRANSACTION_CSV_HEADERS.amount, value: (r) => r.amount.toFixed(2), trusted: true },
  { header: TRANSACTION_CSV_HEADERS.description, value: (r) => r.description },
];

/**
 * The CSV as a byte stream. The next batch is read only when the client is
 * ready for more, so memory stays small and a cancelled download stops reading.
 * A failure midway aborts the download, since the status has already been sent.
 */
function csvStream(batches: AsyncGenerator<ExportedTransaction[]>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(CSV_BOM + csvHeader(COLUMNS)));
    },
    async pull(controller) {
      try {
        const { done, value } = await batches.next();
        if (done) controller.close();
        else controller.enqueue(encoder.encode(csvRows(COLUMNS, value)));
      } catch (error) {
        console.error("GET /api/transactions/export stream error:", error);
        controller.error(error);
      }
    },
    async cancel() {
      await batches.return(undefined);
    },
  });
}

/**
 * GET /api/transactions/export
 * Unduh transaksi pengguna yang login sebagai CSV (UTF-8), mengikuti filter
 * yang sama dengan GET /api/transactions.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
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

    const today = toDateOnlyString(new Date());
    return new Response(csvStream(transactionExportBatches(filter.where, filter.sort, MAX_EXPORT_ROWS)), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transaksi-${today}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (isUnsupportedCharacterError(error)) return unsupportedCharacterResponse();
    console.error("GET /api/transactions/export error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengekspor transaksi." },
      { status: 500 }
    );
  }
}
