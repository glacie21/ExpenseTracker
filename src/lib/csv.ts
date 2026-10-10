/**
 * Minimal RFC 4180 CSV writer with spreadsheet formula-injection protection.
 * This module has no imports so it can be unit-tested directly with Node.
 */

// Cells starting with these are interpreted as formulas by Excel/Sheets/LibreOffice
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/**
 * Escape one cell. Untrusted text that looks like a formula is prefixed with
 * an apostrophe so spreadsheets display it as text instead of evaluating it.
 * Pass `trusted: true` for values the app generated itself (e.g. amounts).
 */
export function escapeCsvField(value: string | number | null | undefined, trusted = false): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (!trusted && FORMULA_PREFIX.test(text)) {
    text = `'${text}`;
  }
  if (/[",\r\n]/.test(text) || text !== text.trim()) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
  /** App-generated values (dates, amounts) skip formula escaping. */
  trusted?: boolean;
}

/** UTF-8 byte order mark so Excel opens the file with the right encoding. */
export const CSV_BOM = "﻿";

export function csvHeader<T>(columns: CsvColumn<T>[]): string {
  return columns.map((c) => escapeCsvField(c.header, true)).join(",") + "\r\n";
}

export function csvRows<T>(columns: CsvColumn<T>[], rows: T[]): string {
  return rows
    .map((row) => columns.map((c) => escapeCsvField(c.value(row), c.trusted)).join(",") + "\r\n")
    .join("");
}
