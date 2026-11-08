import { prisma } from "@/lib/prisma";
import { APP_TIMEZONE } from "@/lib/config";
import {
  AnalyticsScope,
  CategoryBreakdownItem,
  computeTrends,
  getExpenseBreakdown,
  getPeriodTotals,
  toSummaryStats,
} from "@/lib/analytics";
import {
  DateRange,
  PeriodPreset,
  comparisonRanges,
  formatComparisonLabel,
  formatRangeLabel,
  isWholePeriod,
  parseDateOnly,
  toDateOnlyString,
  todayInTimeZone,
  validateCustomRange,
} from "@/lib/dates";
import { centsToAmount, periodChange } from "@/lib/finance";
import { isValidId } from "@/lib/validations";
import { TransactionType } from "@/types";

/** Report period kinds; they decide what "previous period" means. */
export type ReportPeriodType = "week" | "month" | "year" | "custom";

const PERIOD_TO_PRESET: Record<ReportPeriodType, PeriodPreset> = {
  week: "this_week",
  month: "this_month",
  year: "this_year",
  custom: "custom",
};

export interface ReportParams {
  periodType: ReportPeriodType;
  range: DateRange;
  type?: TransactionType;
  categoryId?: string;
}

type ParseResult = { ok: true; params: ReportParams } | { ok: false; message: string };

/**
 * Validate report query params: startDate & endDate (YYYY-MM-DD, required),
 * periodType (week|month|year|custom), type (INCOME|EXPENSE|ALL), categoryId.
 */
export function parseReportParams(search: URLSearchParams): ParseResult {
  const range = validateCustomRange(
    parseDateOnly(search.get("startDate")),
    parseDateOnly(search.get("endDate"))
  );
  if (!range) {
    return {
      ok: false,
      message: "Rentang tanggal tidak valid (YYYY-MM-DD, awal ≤ akhir, maksimal 5 tahun).",
    };
  }

  const periodParam = search.get("periodType") || "custom";
  if (!["week", "month", "year", "custom"].includes(periodParam)) {
    return { ok: false, message: "Jenis periode laporan tidak valid." };
  }

  const typeParam = search.get("type") || "ALL";
  if (!["ALL", "INCOME", "EXPENSE"].includes(typeParam)) {
    return { ok: false, message: "Filter tipe transaksi tidak valid." };
  }

  const categoryId = search.get("categoryId")?.trim() || "";
  if (categoryId && !isValidId(categoryId)) {
    return { ok: false, message: "Filter kategori tidak valid." };
  }

  return {
    ok: true,
    params: {
      // A range that is not exactly that week/month/year is compared as a custom range
      periodType: isWholePeriod(PERIOD_TO_PRESET[periodParam as ReportPeriodType], range)
        ? (periodParam as ReportPeriodType)
        : "custom",
      range,
      type: typeParam === "ALL" ? undefined : (typeParam as TransactionType),
      categoryId: categoryId || undefined,
    },
  };
}

export interface CategoryIncrease {
  categoryId: string;
  name: string;
  color: string | null;
  current: number;
  previous: number;
  difference: number;
  percent: number | null;
}

function categoryIncreases(
  current: CategoryBreakdownItem[],
  previous: CategoryBreakdownItem[]
): CategoryIncrease[] {
  const previousById = new Map(previous.map((p) => [p.categoryId, p.totalCents]));
  return current
    .map((item) => {
      const change = periodChange(item.totalCents, previousById.get(item.categoryId) ?? 0);
      return {
        categoryId: item.categoryId,
        name: item.name,
        color: item.color,
        current: centsToAmount(change.current),
        previous: centsToAmount(change.previous),
        difference: centsToAmount(change.difference),
        percent: change.percent,
      };
    })
    .filter((c) => c.difference > 0)
    .sort((a, b) => b.difference - a.difference)
    .slice(0, 5);
}

function reportContext(userId: string, params: ReportParams) {
  const comparison = comparisonRanges(
    PERIOD_TO_PRESET[params.periodType],
    params.range,
    todayInTimeZone(APP_TIMEZONE)
  );
  const scope: AnalyticsScope = {
    userId,
    range: params.range,
    type: params.type,
    categoryId: params.categoryId,
  };
  return { comparison, scope };
}

/** The report for the period itself, without the comparison queries. */
async function loadPeriod(
  userId: string,
  params: ReportParams,
  { comparison, scope }: ReturnType<typeof reportContext>
) {
  const [totals, breakdown, category] = await Promise.all([
    getPeriodTotals(scope),
    getExpenseBreakdown(scope),
    params.categoryId
      ? prisma.category.findFirst({
          where: { id: params.categoryId, userId },
          select: { id: true, name: true, type: true },
        })
      : Promise.resolve(null),
  ]);

  return {
    totals,
    summary: {
      period: {
        type: params.periodType,
        start: toDateOnlyString(params.range.start),
        end: toDateOnlyString(params.range.end),
        label: formatRangeLabel(params.range),
        previousStart: toDateOnlyString(comparison.previous.start),
        previousEnd: toDateOnlyString(comparison.previous.end),
        previousLabel: formatComparisonLabel(comparison),
      },
      filters: {
        type: params.type ?? "ALL",
        category,
      },
      summary: toSummaryStats(totals),
      topExpenseCategory: breakdown[0] ?? null,
      breakdown,
    },
  };
}

/** Report without trends, for outputs that do not print a comparison (PDF, Word). */
export async function getReportSummary(userId: string, params: ReportParams) {
  return (await loadPeriod(userId, params, reportContext(userId, params))).summary;
}

/** Full report data for the signed-in user (scoped by `userId`). */
export async function getReport(userId: string, params: ReportParams) {
  const context = reportContext(userId, params);
  const { comparison, scope } = context;
  // A running period is compared up to today (see comparisonRanges)
  const comparedScope: AnalyticsScope | null = comparison.partial ? { ...scope, range: comparison.current } : null;
  const previousScope: AnalyticsScope = { ...scope, range: comparison.previous };

  const [period, comparedTotals, previousTotals, comparedBreakdown, previousBreakdown] = await Promise.all([
    loadPeriod(userId, params, context),
    comparedScope ? getPeriodTotals(comparedScope) : null,
    getPeriodTotals(previousScope),
    comparedScope ? getExpenseBreakdown(comparedScope) : null,
    getExpenseBreakdown(previousScope),
  ]);

  return {
    ...period.summary,
    trends: computeTrends(comparedTotals ?? period.totals, previousTotals),
    categoryIncreases: categoryIncreases(comparedBreakdown ?? period.summary.breakdown, previousBreakdown),
  };
}

export type ReportSummary = Awaited<ReturnType<typeof getReportSummary>>;
export type Report = Awaited<ReturnType<typeof getReport>>;
