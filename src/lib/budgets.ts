import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { APP_TIMEZONE } from "@/lib/config";
import { monthRangeUTC, todayInTimeZone } from "@/lib/dates";
import { BudgetStatus, budgetUsage, centsToAmount } from "@/lib/finance";
import { decimalToCents } from "@/lib/money";
import { normalizeAmount, validateBudgetInput } from "@/lib/validations";

export function currentMonthYear(): { month: number; year: number } {
  const today = todayInTimeZone(APP_TIMEZONE);
  return { month: today.getUTCMonth() + 1, year: today.getUTCFullYear() };
}

export interface BudgetWithProgress {
  id: string;
  categoryId: string;
  category: { id: string; name: string; color: string | null };
  month: number;
  year: number;
  amount: number;
  spent: number;
  remaining: number;
  percent: number;
  status: BudgetStatus;
}

/**
 * Budgets of one user for a month, with actual spending: the sum of that
 * user's EXPENSE transactions in the budget's category within the month.
 * One aggregate query for all budgets (no N+1).
 */
export async function getBudgetsWithProgress(userId: string, year: number, month: number) {
  const budgets = await prisma.budget.findMany({
    where: { userId, year, month },
    include: { category: { select: { id: true, name: true, color: true } } },
    orderBy: { category: { name: "asc" } },
  });

  const spentByCategory = new Map<string, number>();
  if (budgets.length > 0) {
    const spending = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        type: "EXPENSE",
        categoryId: { in: budgets.map((b) => b.categoryId) },
        date: monthRangeUTC(year, month),
      },
      _sum: { amount: true },
    });
    for (const s of spending) spentByCategory.set(s.categoryId, decimalToCents(s._sum.amount));
  }

  let totalBudgetCents = 0;
  let totalSpentCents = 0;
  const items: BudgetWithProgress[] = budgets.map((b) => {
    const usage = budgetUsage(decimalToCents(b.amount), spentByCategory.get(b.categoryId) ?? 0);
    totalBudgetCents += usage.budget;
    totalSpentCents += usage.spent;
    return {
      id: b.id,
      categoryId: b.categoryId,
      category: b.category,
      month: b.month,
      year: b.year,
      amount: centsToAmount(usage.budget),
      spent: centsToAmount(usage.spent),
      remaining: centsToAmount(usage.remaining),
      percent: usage.percent,
      status: usage.status,
    };
  });

  const total = budgetUsage(totalBudgetCents, totalSpentCents);
  return {
    month,
    year,
    budgets: items,
    totals: {
      amount: centsToAmount(total.budget),
      spent: centsToAmount(total.spent),
      remaining: centsToAmount(total.remaining),
      percent: total.percent,
      warning: items.filter((i) => i.status === "warning").length,
      reached: items.filter((i) => i.status === "reached").length,
      over: items.filter((i) => i.status === "over").length,
    },
  };
}

export interface BudgetWriteData {
  categoryId: string;
  amount: Prisma.Decimal;
  month: number;
  year: number;
}

type ParseResult =
  | { ok: true; data: BudgetWriteData }
  | { ok: false; status: number; message: string; errors?: Record<string, string> };

/**
 * Validate a create/update body; the category must be one of the user's
 * EXPENSE categories (budgets only apply to spending).
 */
export async function parseBudgetBody(body: unknown, userId: string): Promise<ParseResult> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, status: 400, message: "Data anggaran tidak valid" };
  }
  const input = body as Record<string, unknown>;
  const validation = validateBudgetInput(input);
  if (!validation.isValid) {
    return { ok: false, status: 400, message: "Data anggaran tidak valid", errors: validation.errors };
  }

  const categoryId = input.categoryId as string;
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) {
    return {
      ok: false,
      status: 400,
      message: "Kategori tidak ditemukan atau Anda tidak memiliki akses ke kategori ini.",
      errors: { categoryId: "Kategori tidak valid" },
    };
  }
  if (category.type !== "EXPENSE") {
    return {
      ok: false,
      status: 400,
      message: "Anggaran hanya dapat dibuat untuk kategori pengeluaran.",
      errors: { categoryId: "Pilih kategori pengeluaran" },
    };
  }

  return {
    ok: true,
    data: {
      categoryId,
      amount: new Prisma.Decimal(normalizeAmount(input.amount)!),
      month: Number(input.month),
      year: Number(input.year),
    },
  };
}

export function isDuplicateBudgetError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export const DUPLICATE_BUDGET_MESSAGE =
  "Anggaran untuk kategori ini pada bulan dan tahun tersebut sudah ada. Edit anggaran yang ada.";
