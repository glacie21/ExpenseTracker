/**
 * Date helpers for transaction dates.
 *
 * Transaction dates are calendar days, not instants. They are stored as
 * UTC midnight of that day and always formatted in UTC, so a transaction
 * never shifts to the previous/next day regardless of server or browser
 * timezone.
 *
 * This module has no imports so it can be unit-tested directly with Node.
 */

const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})/;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Parse "YYYY-MM-DD" (or an ISO string starting with it) into UTC midnight.
 * Returns null for malformed or impossible dates (e.g. 2026-02-30).
 */
export function parseDateOnly(value: unknown): Date | null {
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  if (typeof value !== "string") return null;

  const match = DATE_ONLY_REGEX.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

/**
 * Last millisecond of the given UTC calendar day.
 */
export function endOfDayUTC(date: Date): Date {
  return new Date(date.getTime() + DAY_MS - 1);
}

/**
 * UTC range covering a whole month (month is 1-12).
 */
export function monthRangeUTC(year: number, month: number): { gte: Date; lte: Date } {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const nextMonth = new Date(Date.UTC(year, month, 1));
  return { gte: start, lte: new Date(nextMonth.getTime() - 1) };
}

/**
 * Today's date in the user's local timezone as "YYYY-MM-DD".
 */
export function todayLocalISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Periods (dashboard, reports, budgets)
//
// A DateRange is inclusive on both ends and holds calendar days as UTC
// midnight, like transaction dates. Query with { gte: start, lte: endOfDayUTC(end) }.
// ---------------------------------------------------------------------------

/** Longest custom range accepted (protects chart buckets and queries). */
export const MAX_RANGE_DAYS = 366 * 5;

export interface DateRange {
  start: Date;
  end: Date;
}

export type PeriodPreset =
  | "this_week"
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "this_year"
  | "custom";

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "this_week", label: "Minggu ini" },
  { value: "this_month", label: "Bulan ini" },
  { value: "last_month", label: "Bulan lalu" },
  { value: "last_3_months", label: "3 bulan terakhir" },
  { value: "this_year", label: "Tahun ini" },
  { value: "custom", label: "Rentang lain" },
];

export function isPeriodPreset(value: unknown): value is PeriodPreset {
  return PERIOD_PRESETS.some((p) => p.value === value);
}

export function addDaysUTC(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** First day of the month `months` away from the month containing `date`. */
export function addMonthsUTC(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

/** Monday of the ISO week containing `date`. */
export function startOfWeekUTC(date: Date): Date {
  const dayOfWeek = (date.getUTCDay() + 6) % 7; // Monday = 0
  return addDaysUTC(date, -dayOfWeek);
}

export function startOfMonthUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function endOfMonthUTC(date: Date): Date {
  return addDaysUTC(addMonthsUTC(date, 1), -1);
}

/** Number of calendar days in an inclusive range. */
export function rangeLengthDays(range: DateRange): number {
  return Math.round((range.end.getTime() - range.start.getTime()) / DAY_MS) + 1;
}

/** "YYYY-MM-DD" for a calendar day stored as UTC midnight. */
export function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Today's calendar day in `timeZone` (e.g. "Asia/Jakarta"), as UTC midnight. */
export function todayInTimeZone(timeZone: string, now: Date = new Date()): Date {
  let formatted: string;
  try {
    formatted = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    formatted = now.toISOString(); // unknown timezone: fall back to UTC
  }
  return (
    parseDateOnly(formatted) ??
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  );
}

export function weekRange(anchor: Date): DateRange {
  const start = startOfWeekUTC(anchor);
  return { start, end: addDaysUTC(start, 6) };
}

export function monthRange(anchor: Date): DateRange {
  return { start: startOfMonthUTC(anchor), end: endOfMonthUTC(anchor) };
}

export function yearRange(anchor: Date): DateRange {
  const year = anchor.getUTCFullYear();
  return { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year, 11, 31)) };
}

/**
 * Validate a custom range: both days present, start <= end, at most MAX_RANGE_DAYS.
 */
export function validateCustomRange(start: Date | null, end: Date | null): DateRange | null {
  if (!start || !end || start.getTime() > end.getTime()) return null;
  const range = { start, end };
  return rangeLengthDays(range) <= MAX_RANGE_DAYS ? range : null;
}

/**
 * Resolve a preset to whole calendar periods relative to `today`.
 * Presets cover the full period (e.g. This Month = 1st to last day).
 */
export function resolvePeriod(
  preset: PeriodPreset,
  today: Date,
  custom?: { start: Date | null; end: Date | null }
): DateRange | null {
  switch (preset) {
    case "this_week":
      return weekRange(today);
    case "this_month":
      return monthRange(today);
    case "last_month":
      return monthRange(addMonthsUTC(today, -1));
    case "last_3_months":
      return { start: addMonthsUTC(today, -2), end: endOfMonthUTC(today) };
    case "this_year":
      return yearRange(today);
    case "custom":
      return validateCustomRange(custom?.start ?? null, custom?.end ?? null);
  }
}

/**
 * The comparison period: the same calendar unit before (previous week,
 * month, 3 months or year), or for custom ranges the same number of days
 * immediately before.
 */
export function previousPeriod(preset: PeriodPreset, range: DateRange): DateRange {
  switch (preset) {
    case "this_week":
      return { start: addDaysUTC(range.start, -7), end: addDaysUTC(range.end, -7) };
    case "this_month":
    case "last_month":
      return monthRange(addMonthsUTC(range.start, -1));
    case "last_3_months":
      return { start: addMonthsUTC(range.start, -3), end: addDaysUTC(range.start, -1) };
    case "this_year":
      return yearRange(new Date(Date.UTC(range.start.getUTCFullYear() - 1, 0, 1)));
    case "custom": {
      const length = rangeLengthDays(range);
      return { start: addDaysUTC(range.start, -length), end: addDaysUTC(range.start, -1) };
    }
  }
}

export type Granularity = "day" | "week" | "month";

/** Daily up to ~1 month, weekly up to ~3 months, monthly beyond. */
export function chooseGranularity(range: DateRange): Granularity {
  const days = rangeLengthDays(range);
  if (days <= 31) return "day";
  if (days <= 93) return "week";
  return "month";
}

export function bucketStart(date: Date, granularity: Granularity): Date {
  if (granularity === "week") return startOfWeekUTC(date);
  if (granularity === "month") return startOfMonthUTC(date);
  return date;
}

/** Every bucket start covering `range`, in order (used to fill empty buckets). */
export function bucketStarts(range: DateRange, granularity: Granularity): Date[] {
  const buckets: Date[] = [];
  let cursor = bucketStart(range.start, granularity);
  while (cursor.getTime() <= range.end.getTime()) {
    buckets.push(cursor);
    cursor =
      granularity === "month"
        ? addMonthsUTC(cursor, 1)
        : addDaysUTC(cursor, granularity === "week" ? 7 : 1);
  }
  return buckets;
}

const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** Short Indonesian label, e.g. "8 Okt 2026" (or "8 Okt" without year). */
export function formatDayLabel(date: Date, withYear = true): string {
  const base = `${date.getUTCDate()} ${MONTHS_ID[date.getUTCMonth()]}`;
  return withYear ? `${base} ${date.getUTCFullYear()}` : base;
}

export function formatMonthLabel(date: Date): string {
  return `${MONTHS_ID[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Human label for an inclusive range, e.g. "1 Okt 2026 – 31 Okt 2026". */
export function formatRangeLabel(range: DateRange): string {
  if (range.start.getTime() === range.end.getTime()) return formatDayLabel(range.start);
  return `${formatDayLabel(range.start)} – ${formatDayLabel(range.end)}`;
}
