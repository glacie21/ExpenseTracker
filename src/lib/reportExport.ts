import { prisma } from "@/lib/prisma";
import { APP_TIMEZONE } from "@/lib/config";
import { scopeWhere } from "@/lib/analytics";
import { formatPercent } from "@/lib/finance";
import { formatRupiah } from "@/lib/formatters";
import { Report, ReportParams, getReport } from "@/lib/reports";

export interface ReportTransactionRow {
  date: Date;
  title: string;
  category: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string | null;
}

/** Everything a downloadable report (PDF, Excel, Word) is built from. */
export interface ReportExportData {
  report: Report;
  userName: string;
  generatedAt: string;
  transactions: ReportTransactionRow[];
  /** All matching transactions; larger than `transactions.length` when capped. */
  totalTransactions: number;
}

/** Report summary plus up to `maxRows` matching transactions, oldest first. */
export async function loadReportExport(
  user: { id: string; name: string },
  params: ReportParams,
  maxRows: number
): Promise<ReportExportData> {
  const [report, rows] = await Promise.all([
    getReport(user.id, params),
    prisma.transaction.findMany({
      // Same filter as the report totals, so the list always matches the summary
      where: scopeWhere({ userId: user.id, ...params }),
      select: {
        date: true,
        title: true,
        type: true,
        amount: true,
        description: true,
        category: { select: { name: true } },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      take: maxRows,
    }),
  ]);

  const generatedAt = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: APP_TIMEZONE,
  }).format(new Date());

  return {
    report,
    userName: user.name,
    generatedAt: `${generatedAt} (${APP_TIMEZONE})`,
    totalTransactions: report.summary.transactionCount,
    transactions: rows.map((r) => ({
      date: r.date,
      title: r.title,
      category: r.category.name,
      type: r.type,
      amount: r.amount.toNumber(),
      description: r.description,
    })),
  };
}

/*
 * Wording and colours shared by the PDF, Excel and Word builders, so the three
 * files say the same thing. Each builder only decides the layout.
 */

/** Hex colours without "#"; Excel prefixes "FF", the PDF converts to rgb. */
export const REPORT_COLORS = {
  brand: "0D5C50",
  income: "1B7A4C",
  expense: "B4234A",
  muted: "5C6B65",
} as const;

export const NO_TRANSACTIONS_TEXT = "Tidak ada transaksi yang sesuai dengan filter pada periode ini.";

/** "Pemasukan" / "Pengeluaran" / "Semua" for a transaction type or the type filter. */
export function typeFilterLabel(type: Report["filters"]["type"]): string {
  return type === "INCOME" ? "Pemasukan" : type === "EXPENSE" ? "Pengeluaran" : "Semua";
}

export function categoryFilterLabel(report: Report): string {
  return report.filters.category?.name ?? "Semua";
}

export function reportTitle(report: Report): string {
  return `Laporan Keuangan ${report.period.label}`;
}

export function filterSummary(report: Report): string {
  return `Filter: tipe ${typeFilterLabel(report.filters.type)}; kategori ${categoryFilterLabel(report)}`;
}

export function topCategoryText(report: Report): string {
  const top = report.topExpenseCategory;
  return top ? `${top.name} (${formatRupiah(top.total)})` : "-";
}

/** Note shown when the file lists fewer transactions than match; null when complete. */
export function truncationNote(data: ReportExportData, fullDataIn: string): string | null {
  if (data.totalTransactions <= data.transactions.length) return null;
  return `Menampilkan ${data.transactions.length} dari ${data.totalTransactions} transaksi. Unduh ${fullDataIn} untuk data lengkap.`;
}

export interface SummaryRow {
  label: string;
  value: string;
  /** Net balance row: bold, coloured by sign. */
  tone?: "income" | "expense";
}

/** Summary table as text, for the formats that print it (PDF, Word). */
export function summaryRows(report: Report): SummaryRow[] {
  const s = report.summary;
  return [
    { label: "Total pemasukan", value: formatRupiah(s.totalIncome) },
    { label: "Total pengeluaran", value: formatRupiah(s.totalExpense) },
    {
      label: "Saldo bersih",
      value: formatRupiah(s.netBalance),
      tone: s.netBalance < 0 ? "expense" : "income",
    },
    // Without income there is no meaningful savings rate
    { label: "Tingkat tabungan", value: s.totalIncome > 0 ? formatPercent(s.savingsRate) : "-" },
    { label: "Jumlah transaksi", value: String(s.transactionCount) },
    { label: "Kategori pengeluaran terbesar", value: topCategoryText(report) },
  ];
}
