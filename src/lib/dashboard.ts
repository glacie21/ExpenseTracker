import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.transaction.findMany({
      where: { userId },
      include: { category: { select: TRANSACTION_CATEGORY_SELECT } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: RECENT_TRANSACTIONS_LIMIT,
    }),
  ]);

  const income = totals.find((t) => t.type === "INCOME");
  const expense = totals.find((t) => t.type === "EXPENSE");

  // Decimal arithmetic avoids floating-point rounding errors
  const totalIncome = income?._sum.amount ?? new Prisma.Decimal(0);
  const totalExpense = expense?._sum.amount ?? new Prisma.Decimal(0);
  const balance = totalIncome.minus(totalExpense);

  const incomeCount = income?._count._all ?? 0;
  const expenseCount = expense?._count._all ?? 0;

  return {
    summary: {
      totalIncome: totalIncome.toNumber(),
      totalExpense: totalExpense.toNumber(),
      totalBalance: balance.toNumber(),
      netSavings: balance.toNumber(),
      incomeCount,
      expenseCount,
      totalCount: incomeCount + expenseCount,
    },
    recentTransactions: recentTransactions.map(serializeTransaction),
  };
}
