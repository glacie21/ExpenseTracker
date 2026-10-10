/**
 * Utility formatters for Expense Tracker
 */
import { todayLocalISO } from "@/lib/dates";

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Format number to Indonesian Rupiah currency string.
 * Example: 1250000 -> "Rp1.250.000", -25000 -> "-Rp25.000"
 */
export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "Rp0";
  }

  const numericValue = typeof amount === "string" ? parseFloat(amount) : amount;

  // Intl inserts a (non-breaking) space after "Rp"; the app style is "Rp1.250.000"
  return rupiahFormatter.format(numericValue).replace(/\s+/g, "");
}

/**
 * Format a transaction date (stored as UTC midnight) to a readable Indonesian string.
 * Example: 2026-10-08 -> "08 Okt 2026"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
  } catch {
    return "-";
  }
}

/**
 * Format a transaction date to YYYY-MM-DD for HTML input[type="date"].
 * Without a value, returns today's date in the user's local timezone.
 */
export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) return todayLocalISO();
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return todayLocalISO();
  return d.toISOString().split("T")[0];
}
