import { prisma } from "@/lib/prisma";
import { APP_TIMEZONE } from "@/lib/config";
import { AnalyticsScope, scopeHasFractionalAmount, scopeWhere } from "@/lib/analytics";
import { formatPercent } from "@/lib/finance";
import { formatRupiah } from "@/lib/formatters";
import { Report, ReportParams, ReportSummary, getReport, getReportSummary } from "@/lib/reports";
import { transactionOrder } from "@/lib/transactionKeyset";
import { ExportedTransaction, TRANSACTION_EXPORT_SELECT, transactionExportBatches } from "@/lib/transactions";

export interface ReportTransactionRow {
  date: Date;
  title: string;
  category: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string | null;
}

interface ReportUser {
  id: string;
  name: string;
}

/** What every downloadable report starts from. */
interface ReportHeader<R extends ReportSummary> {
  report: R;
  userName: string;
  generatedAt: string;
  /** All matching transactions, which may be more than a capped file lists. */
  totalTransactions: number;
}

/** Input of the PDF and Word builders: transactions held in memory, capped to a few thousand. */
export interface ReportExportData extends ReportHeader<ReportSummary> {
  transactions: ReportTransactionRow[];
}

/** Input of the Excel builder: the full report, with transactions read in batches while writing. */
export interface ReportStreamData extends ReportHeader<Report> {
  batches: AsyncIterable<ReportTransactionRow[]>;
  /** Some matching amount has sen, so money columns show two decimals. */
  hasFractionalAmount: boolean;
}

function toRow(r: ExportedTransaction): ReportTransactionRow {
  return {
    date: r.date,
    title: r.title,
    category: r.category.name,
    type: r.type,
    amount: r.amount.toNumber(),
    description: r.description,
  };
}

function header<R extends ReportSummary>(user: ReportUser, report: R): ReportHeader<R> {
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
  };
}

/** Report summary plus up to `maxRows` matching transactions, in memory. */
export async function loadReportExport(
  user: ReportUser,
  params: ReportParams,
  maxRows: number
): Promise<ReportExportData> {
  const [report, rows] = await Promise.all([
    getReportSummary(user.id, params),
    prisma.transaction.findMany({
      // Same filter as the report totals, so the list always matches the summary
      where: scopeWhere({ userId: user.id, ...params }),
      select: TRANSACTION_EXPORT_SELECT,
      orderBy: transactionOrder("asc"),
      take: maxRows,
    }),
  ]);
  return { ...header(user, report), transactions: rows.map(toRow) };
}

/** Oldest first, up to `maxRows`, one batch in memory at a time. */
async function* reportRowBatches(scope: AnalyticsScope, maxRows: number): AsyncGenerator<ReportTransactionRow[]> {
  for await (const batch of transactionExportBatches(scopeWhere(scope), "asc", maxRows)) {
    yield batch.map(toRow);
  }
}

/** Full report plus a batched reader of up to `maxRows` transactions. */
export async function loadReportStream(
  user: ReportUser,
  params: ReportParams,
  maxRows: number
): Promise<ReportStreamData> {
  const scope: AnalyticsScope = { userId: user.id, ...params };
  const [report, hasFractionalAmount] = await Promise.all([
    getReport(user.id, params),
    scopeHasFractionalAmount(scope),
  ]);
  return { ...header(user, report), hasFractionalAmount, batches: reportRowBatches(scope, maxRows) };
}

/*
 * Wording and colours shared by the PDF, Excel and Word builders, so the three
 * files say the same thing. Each builder only decides the layout.
 */

/** Hex colours without "#"; Excel prefixes "FF", the PDF converts to rgb. */
export const REPORT_COLORS = {
  ink: "13241F",
  brand: "0D5C50",
  income: "1B7A4C",
  expense: "B4234A",
  muted: "5C6B65",
  rule: "D2DAD4",
} as const;

export const NO_TRANSACTIONS_TEXT = "Tidak ada transaksi yang sesuai dengan filter pada periode ini.";

/** "Pemasukan" / "Pengeluaran" / "Semua" for a transaction type or the type filter. */
export function typeFilterLabel(type: ReportSummary["filters"]["type"]): string {
  return type === "INCOME" ? "Pemasukan" : type === "EXPENSE" ? "Pengeluaran" : "Semua";
}

export function categoryFilterLabel(report: ReportSummary): string {
  return report.filters.category?.name ?? "Semua";
}

export function reportTitle(report: ReportSummary): string {
  return `Laporan Keuangan ${report.period.label}`;
}

export function filterSummary(report: ReportSummary): string {
  return `Filter: tipe ${typeFilterLabel(report.filters.type)}; kategori ${categoryFilterLabel(report)}`;
}

export function topCategoryText(report: ReportSummary): string {
  const top = report.topExpenseCategory;
  return top ? `${top.name} (${formatRupiah(top.total)})` : "-";
}

/** Note shown when the file lists fewer transactions than match; null when complete. */
export function truncationNote(listed: number, total: number, fullDataIn: string): string | null {
  if (total <= listed) return null;
  return `Menampilkan ${listed} dari ${total} transaksi. Unduh ${fullDataIn} untuk data lengkap.`;
}

export interface SummaryRow {
  label: string;
  value: string;
  /** Net balance row: bold, coloured by sign. */
  tone?: "income" | "expense";
}

/** Summary table as text, for the formats that print it (PDF, Word). */
export function summaryRows(report: ReportSummary): SummaryRow[] {
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
