/**
 * Utility formatters for Expense Tracker
 */

/**
 * Format number to Indonesian Rupiah currency string.
 * Example: 1250000 -> "Rp 1.250.000"
 */
export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "Rp 0";
  }

  const numericValue = typeof amount === "string" ? parseFloat(amount) : amount;

  // Format with standard Indonesian locale
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue);

  // Normalise non-breaking spaces or replace "Rp" prefix spacing
  return formatted.replace(/\s+/g, " ");
}

/**
 * Format Date to readable Indonesian date string.
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
    }).format(d);
  } catch {
    return "-";
  }
}

/**
 * Format Date to YYYY-MM-DD for HTML input[type="date"]
 */
export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) {
    const now = new Date();
    return now.toISOString().split("T")[0];
  }
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
    return d.toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}
