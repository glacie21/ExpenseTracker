import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { APP_TIMEZONE } from "@/lib/config";
import { endOfDayUTC } from "@/lib/dates";
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
  const where: Prisma.TransactionWhereInput = {
    userId: user.id,
    date: { gte: params.range.start, lte: endOfDayUTC(params.range.end) },
    ...(params.type ? { type: params.type } : {}),
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
  };

  const [report, total, rows] = await Promise.all([
    getReport(user.id, params),
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
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
    totalTransactions: total,
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

/** "Pemasukan" / "Pengeluaran" / "Semua" for the type filter. */
export function typeFilterLabel(type: Report["filters"]["type"]): string {
  return type === "INCOME" ? "Pemasukan" : type === "EXPENSE" ? "Pengeluaran" : "Semua";
}
