import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { APP_TIMEZONE } from "@/lib/config";
import { decimalToCents } from "@/lib/money";
import {
  Comparison,
  DateRange,
  Granularity,
  PeriodPreset,
  bucketStarts,
  chooseGranularity,
  comparisonRanges,
  endOfDayUTC,
  formatComparisonLabel,
  formatRangeLabel,
  isPeriodPreset,
  parseDateOnly,
  resolvePeriod,
  toDateOnlyString,
  todayInTimeZone,
} from "@/lib/dates";
import {
  PeriodChange,
  centsToAmount,
  netBalanceCents,
  periodChange,
  savingsRate,
  shareOfTotal,
} from "@/lib/finance";
import { TransactionType } from "@/types";

/**
 * Server-side analytics for dashboard and reports. Every query is scoped to
 * `userId` and aggregated in PostgreSQL; amounts come back as Decimal and are
 * converted to exact integer cents before any arithmetic.
 */

export interface AnalyticsScope {
  userId: string;
  range: DateRange;
  type?: TransactionType;
  categoryId?: string;
}

function scopeWhere(scope: AnalyticsScope): Prisma.TransactionWhereInput {
  return {
    userId: scope.userId,
    date: { gte: scope.range.start, lte: endOfDayUTC(scope.range.end) },
    ...(scope.type ? { type: scope.type } : {}),
    ...(scope.categoryId ? { categoryId: scope.categoryId } : {}),
  };
}

export interface PeriodTotals {
  incomeCents: number;
  expenseCents: number;
  incomeCount: number;
  expenseCount: number;
}

export async function getPeriodTotals(scope: AnalyticsScope): Promise<PeriodTotals> {
  const groups = await prisma.transaction.groupBy({
    by: ["type"],
    where: scopeWhere(scope),
    _sum: { amount: true },
    _count: { _all: true },
  });
  const income = groups.find((g) => g.type === "INCOME");
  const expense = groups.find((g) => g.type === "EXPENSE");
  return {
    incomeCents: decimalToCents(income?._sum.amount),
    expenseCents: decimalToCents(expense?._sum.amount),
    incomeCount: income?._count._all ?? 0,
    expenseCount: expense?._count._all ?? 0,
  };
}

export interface SeriesPoint {
  /** Bucket start, YYYY-MM-DD */
  date: string;
  income: number;
  expense: number;
}

/**
 * Income and expense per day/week/month bucket. Empty buckets are filled
 * with zero so the chart's time axis is continuous.
 */
export async function getTimeSeries(
  scope: AnalyticsScope,
  granularity: Granularity = chooseGranularity(scope.range)
): Promise<SeriesPoint[]> {
  // Bounds are passed as plain dates: a JS Date parameter would be sent as
  // timestamptz and shifted by the DB session timezone when compared with the
  // timezone-less "date" column.
  const rows = await prisma.$queryRaw<
    { bucket: Date; type: TransactionType; total: Prisma.Decimal }[]
  >`
    SELECT date_trunc(${granularity}, "date") AS bucket, "type", SUM("amount") AS total
    FROM "transactions"
    WHERE "userId" = ${scope.userId}
      AND "date" >= ${toDateOnlyString(scope.range.start)}::date
      AND "date" < (${toDateOnlyString(scope.range.end)}::date + 1)
      ${scope.type ? Prisma.sql`AND "type" = ${scope.type}::"TransactionType"` : Prisma.empty}
      ${scope.categoryId ? Prisma.sql`AND "categoryId" = ${scope.categoryId}` : Prisma.empty}
    GROUP BY 1, 2
  `;

  const byBucket = new Map<string, { income: number; expense: number }>();
  for (const row of rows) {
    const key = toDateOnlyString(row.bucket);
    const entry = byBucket.get(key) ?? { income: 0, expense: 0 };
    if (row.type === "INCOME") entry.income += decimalToCents(row.total);
    else entry.expense += decimalToCents(row.total);
    byBucket.set(key, entry);
  }

  return bucketStarts(scope.range, granularity).map((start) => {
    const key = toDateOnlyString(start);
    const entry = byBucket.get(key) ?? { income: 0, expense: 0 };
    return { date: key, income: centsToAmount(entry.income), expense: centsToAmount(entry.expense) };
  });
}

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  color: string | null;
  total: number;
  totalCents: number;
  count: number;
  /** Share of total expenses in the scope, 0-100 */
  percent: number;
}

/** Expense totals per category in the scope, largest first. */
export async function getExpenseBreakdown(scope: AnalyticsScope): Promise<CategoryBreakdownItem[]> {
  if (scope.type === "INCOME") return [];

  const groups = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { ...scopeWhere(scope), type: "EXPENSE" },
    _sum: { amount: true },
    _count: { _all: true },
  });
  if (groups.length === 0) return [];

  // One query for all category names (no N+1)
  const categories = await prisma.category.findMany({
    where: { userId: scope.userId, id: { in: groups.map((g) => g.categoryId) } },
    select: { id: true, name: true, color: true },
  });
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const totalCents = groups.reduce((sum, g) => sum + decimalToCents(g._sum.amount), 0);

  return groups
    .map((g) => {
      const cents = decimalToCents(g._sum.amount);
      const category = categoryById.get(g.categoryId);
      return {
        categoryId: g.categoryId,
        name: category?.name ?? "Tanpa kategori",
        color: category?.color ?? null,
        total: centsToAmount(cents),
        totalCents: cents,
        count: g._count._all,
        percent: shareOfTotal(cents, totalCents),
      };
    })
    .sort((a, b) => b.totalCents - a.totalCents || a.name.localeCompare(b.name));
}

export interface SummaryStats {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  savingsRate: number;
  incomeCount: number;
  expenseCount: number;
  transactionCount: number;
}

export function toSummaryStats(totals: PeriodTotals): SummaryStats {
  return {
    totalIncome: centsToAmount(totals.incomeCents),
    totalExpense: centsToAmount(totals.expenseCents),
    netBalance: centsToAmount(netBalanceCents(totals.incomeCents, totals.expenseCents)),
    savingsRate: savingsRate(totals.incomeCents, totals.expenseCents),
    incomeCount: totals.incomeCount,
    expenseCount: totals.expenseCount,
    transactionCount: totals.incomeCount + totals.expenseCount,
  };
}

function changeInRupiah(change: PeriodChange) {
  return {
    current: centsToAmount(change.current),
    previous: centsToAmount(change.previous),
    difference: centsToAmount(change.difference),
    percent: change.percent,
  };
}

export type RupiahChange = ReturnType<typeof changeInRupiah>;

export interface Trends {
  income: RupiahChange;
  expense: RupiahChange;
  netBalance: RupiahChange;
}

export function computeTrends(current: PeriodTotals, previous: PeriodTotals): Trends {
  return {
    income: changeInRupiah(periodChange(current.incomeCents, previous.incomeCents)),
    expense: changeInRupiah(periodChange(current.expenseCents, previous.expenseCents)),
    netBalance: changeInRupiah(
      periodChange(
        netBalanceCents(current.incomeCents, current.expenseCents),
        netBalanceCents(previous.incomeCents, previous.expenseCents)
      )
    ),
  };
}

export interface ResolvedPeriod {
  preset: PeriodPreset;
  range: DateRange;
  /** What the trends compare; cut at today while the period is still running. */
  comparison: Comparison;
  label: string;
  previousLabel: string;
  /** Query string values to reproduce the period */
  start: string;
  end: string;
}

function describe(preset: PeriodPreset, range: DateRange, today: Date): ResolvedPeriod {
  const comparison = comparisonRanges(preset, range, today);
  return {
    preset,
    range,
    comparison,
    label: formatRangeLabel(range),
    previousLabel: formatComparisonLabel(comparison),
    start: toDateOnlyString(range.start),
    end: toDateOnlyString(range.end),
  };
}

/**
 * Resolve ?period=<preset>&start=YYYY-MM-DD&end=YYYY-MM-DD using "today" in
 * APP_TIMEZONE. Unknown/invalid input falls back to This Month, so the
 * dashboard always renders; `valid` tells API callers to reject it instead.
 */
export function resolvePeriodFromParams(params: {
  period?: string | null;
  start?: string | null;
  end?: string | null;
}): { valid: boolean; period: ResolvedPeriod } {
  const today = todayInTimeZone(APP_TIMEZONE);
  const preset = params.period ?? "this_month";

  if (isPeriodPreset(preset)) {
    const range = resolvePeriod(preset, today, {
      start: parseDateOnly(params.start),
      end: parseDateOnly(params.end),
    });
    if (range) return { valid: true, period: describe(preset, range, today) };
  }

  return {
    valid: false,
    period: describe("this_month", resolvePeriod("this_month", today)!, today),
  };
}

/** Everything the dashboard needs for one period. */
export async function getDashboardAnalytics(userId: string, period: ResolvedPeriod) {
  const current: AnalyticsScope = { userId, range: period.range };
  const { comparison } = period;
  const [totals, comparedTotals, previousTotals, series, breakdown] = await Promise.all([
    getPeriodTotals(current),
    // Only a running period needs its own to-date totals for the trends
    comparison.partial ? getPeriodTotals({ userId, range: comparison.current }) : null,
    getPeriodTotals({ userId, range: comparison.previous }),
    getTimeSeries(current),
    getExpenseBreakdown(current),
  ]);

  return {
    summary: toSummaryStats(totals),
    trends: computeTrends(comparedTotals ?? totals, previousTotals),
    hasPreviousData: previousTotals.incomeCount + previousTotals.expenseCount > 0,
    granularity: chooseGranularity(period.range),
    series,
    breakdown,
  };
}
