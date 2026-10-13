/**
 * Utility formatters for Expense Tracker
 */
import { todayLocalISO } from "@/lib/dates";

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Amounts with sen always show two decimals ("Rp150.000,50", not ",5")
const rupiahWithSenFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format number to Indonesian Rupiah currency string.
 * Example: 1250000 -> "Rp1.250.000", 150000.5 -> "Rp150.000,50", -25000 -> "-Rp25.000"
 */
export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "Rp0";
  }

  const numericValue = typeof amount === "string" ? parseFloat(amount) : amount;

  const hasSen = Math.round(numericValue * 100) % 100 !== 0;
  const formatter = hasSen ? rupiahWithSenFormatter : rupiahFormatter;

  // Intl inserts a (non-breaking) space after "Rp"; the app style is "Rp1.250.000"
  return formatter.format(numericValue).replace(/\s+/g, "");
}

const compactFormatter = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/**
 * Short Rupiah for chart axes, e.g. 1500000 -> "Rp1,5 jt", 25000 -> "Rp25 rb".
 */
export function formatRupiahCompact(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}Rp${compactFormatter.format(Math.abs(amount))}`;
}

/**
 * Signed Rupiah for changes, e.g. +Rp25.000 / -Rp25.000 / Rp0.
 */
export function formatRupiahSigned(amount: number): string {
  if (amount > 0) return `+${formatRupiah(amount)}`;
  return formatRupiah(amount);
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

/** Option text in a category select; the type is spelled out only when both types are listed. */
export function categoryOptionLabel(
  category: { name: string; type: "INCOME" | "EXPENSE" },
  listedType: "ALL" | "INCOME" | "EXPENSE"
): string {
  if (listedType !== "ALL") return category.name;
  return `${category.name} (${category.type === "INCOME" ? "pemasukan" : "pengeluaran"})`;
}
