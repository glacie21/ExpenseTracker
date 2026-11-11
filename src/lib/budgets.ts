import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { APP_TIMEZONE } from "@/lib/config";
import { monthRangeUTC, todayInTimeZone } from "@/lib/dates";
import { BudgetStatus, budgetUsage, centsToAmount } from "@/lib/finance";
import { decimalToCents } from "@/lib/money";
import { budgetPeriodErrors, normalizeAmount, validateBudgetInput } from "@/lib/validations";
import type { ParseFailure } from "@/lib/apiResponse";

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
  // Spending of every expense category in the month, read alongside the budgets
  // rather than after them; categories without a budget are simply not used.
  const [budgets, spending] = await Promise.all([
    prisma.budget.findMany({
      where: { userId, year, month },
      include: { category: { select: { id: true, name: true, color: true } } },
      orderBy: { category: { name: "asc" } },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "EXPENSE", date: monthRangeUTC(year, month) },
      _sum: { amount: true },
    }),
  ]);
  const spentByCategory = new Map(spending.map((s) => [s.categoryId, decimalToCents(s._sum.amount)]));

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

interface BudgetWriteData {
  categoryId: string;
  amount: Prisma.Decimal;
  month: number;
  year: number;
}

type ParseResult = { ok: true; data: BudgetWriteData } | ParseFailure;

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
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId }, select: { type: true } });
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

export type BudgetsResult = Awaited<ReturnType<typeof getBudgetsWithProgress>>;

/** 409 for a second budget on the same category and month. */
export function duplicateBudgetResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "Anggaran untuk kategori ini pada bulan dan tahun tersebut sudah ada. Edit anggaran yang ada.",
      errors: { categoryId: "Anggaran sudah ada" },
    },
    { status: 409 }
  );
}

/** A budget row as JSON (Decimal amount as a number). */
export function serializeBudget<T extends { amount: Prisma.Decimal }>(budget: T): Omit<T, "amount"> & { amount: number } {
  return { ...budget, amount: budget.amount.toNumber() };
}

/**
 * Month and year from `?month=&year=`, defaulting to the current month.
 * Same rules as a budget body.
 */
export function parseBudgetPeriod(
  search: URLSearchParams
): { ok: true; month: number; year: number } | { ok: false; message: string } {
  const fallback = currentMonthYear();
  const month = Number(search.get("month") || fallback.month);
  const year = Number(search.get("year") || fallback.year);
  if (Object.keys(budgetPeriodErrors(month, year)).length > 0) {
    return { ok: false, message: "Bulan atau tahun tidak valid." };
  }
  return { ok: true, month, year };
}
