import { prisma } from "@/lib/prisma";
import { getTotals, toSummaryStats } from "@/lib/analytics";
import { TRANSACTION_CATEGORY_SELECT, serializeTransaction } from "@/lib/transactions";

export const RECENT_TRANSACTIONS_LIMIT = 5;

/**
 * Financial summary for one user, aggregated in PostgreSQL.
 *
 * Total Balance = Net Savings = Total Income - Total Expense over every
 * recorded transaction (not an actual bank balance).
 */
export async function getDashboardSummary(userId: string) {
  const [totals, recentTransactions] = await Promise.all([
    getTotals({ userId }),
    prisma.transaction.findMany({
      where: { userId },
      include: { category: { select: TRANSACTION_CATEGORY_SELECT } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: RECENT_TRANSACTIONS_LIMIT,
    }),
  ]);

  // Same integer-cent arithmetic as the period analytics
  const stats = toSummaryStats(totals);

  return {
    summary: {
      totalIncome: stats.totalIncome,
      totalExpense: stats.totalExpense,
      totalBalance: stats.netBalance,
      netSavings: stats.netBalance,
      incomeCount: stats.incomeCount,
      expenseCount: stats.expenseCount,
      totalCount: stats.transactionCount,
    },
    recentTransactions: recentTransactions.map(serializeTransaction),
  };
}

export type DashboardSummary = Awaited<ReturnType<typeof getDashboardSummary>>;
