/**
 * Date helpers for transaction dates.
 *
 * Transaction dates are calendar days, not instants. They are stored as
 * UTC midnight of that day and always formatted in UTC, so a transaction
 * never shifts to the previous/next day regardless of server or browser
 * timezone.
 */

const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})/;

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
  return new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1);
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
