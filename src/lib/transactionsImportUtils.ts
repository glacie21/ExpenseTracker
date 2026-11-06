/**
 * Pure parsing utilities and shared types for transaction CSV imports.
 * Only type imports here (erased at runtime) so it can be unit-tested directly with Node.
 * Validation of the parsed values is left to validateTransactionInput / parseDateOnly.
 */
import type { TransactionType } from "@/types";

export const MAX_IMPORT_ROWS = 2000;
export const PREVIEW_ROW_LIMIT = 10;
export const ERROR_SAMPLE_LIMIT = 5;

export interface ParsedImportRow {
  rowNumber: number; // 1-based line in the file; row 1 is the header
  date: string; // YYYY-MM-DD when valid, otherwise the raw cell
  title: string;
  type: TransactionType;
  categoryName: string;
  amount: string; // exact decimal string; "0" when invalid
  description: string | null;
  errors: string[];
  isNewCategory: boolean;
}

export interface ImportPreviewData {
  totalRows: number;
  validCount: number;
  errorCount: number;
  newCategories: { name: string; type: TransactionType }[];
  previewRows: ParsedImportRow[];
  /** First ERROR_SAMPLE_LIMIT invalid rows; use errorCount for the total. */
  errorSamples: { row: number; errors: string[] }[];
}

export interface HeaderIndices {
  dateCol: number;
  titleCol: number;
  typeCol: number;
  categoryCol: number;
  amountCol: number;
  descCol: number;
}

const DMY_DATE_REGEX = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;

const HEADER_ALIASES: Record<keyof HeaderIndices, string[]> = {
  dateCol: ["tanggal", "date", "tgl", "waktu"],
  titleCol: ["judul", "nama", "title", "name", "keterangan", "transaksi", "uraian"],
  typeCol: ["tipe", "type", "jenis"],
  categoryCol: ["kategori", "category", "pos"],
  amountCol: ["nominal", "amount", "jumlah", "nilai", "total"],
  descCol: ["deskripsi", "description", "catatan", "note", "notes", "memo"],
};

/**
 * Identify column indexes from the CSV header row.
 */
export function detectHeaderIndices(headerRow: string[]): { indices: HeaderIndices | null; error?: string } {
  const norm = headerRow.map((h) => h.trim().toLowerCase());
  const find = (key: keyof HeaderIndices) => norm.findIndex((h) => HEADER_ALIASES[key].includes(h));

  const indices: HeaderIndices = {
    dateCol: find("dateCol"),
    titleCol: find("titleCol"),
    typeCol: find("typeCol"),
    categoryCol: find("categoryCol"),
    amountCol: find("amountCol"),
    descCol: find("descCol"),
  };

  const missing: string[] = [];
  if (indices.dateCol === -1) missing.push("Tanggal (atau Date)");
  if (indices.titleCol === -1) missing.push("Judul (atau Title/Nama/Keterangan)");
  if (indices.amountCol === -1) missing.push("Nominal (atau Amount/Jumlah)");

  if (missing.length > 0) {
    return {
      indices: null,
      error: `Kolom wajib tidak ditemukan dalam file CSV: ${missing.join(", ")}. Pastikan baris pertama berisi nama kolom.`,
    };
  }
  return { indices };
}

/**
 * Rewrite DD/MM/YYYY or DD-MM-YYYY into YYYY-MM-DD; anything else is returned
 * unchanged. Whether the result is a real calendar day is up to parseDateOnly.
 */
export function normalizeImportDate(raw: string): string {
  const match = DMY_DATE_REGEX.exec(raw);
  if (!match) return raw;
  const [, d, m, y] = match;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/**
 * Strip currency symbols, sign/parentheses and Indonesian/US thousand
 * separators, leaving a plain decimal string ("1250000.50") for normalizeAmount.
 */
export function parseImportAmount(raw: string): string {
  let s = raw;
  // A sign or accounting parentheses are dropped: the type column decides income vs expense
  if (s.startsWith("-") || (s.startsWith("(") && s.endsWith(")"))) {
    s = s.replace(/^[-(]+|[)]+$/g, "").trim();
  }

  // Remove currency identifiers (Rp, IDR, $, etc)
  s = s.replace(/^(rp|idr|usd|sgd|\$)\.?\s*/i, "").trim();

  const dots = s.split(".").length - 1;
  const commas = s.split(",").length - 1;
  if (dots > 0 && commas > 0) {
    // The separator that comes last is the decimal one
    s = s.lastIndexOf(",") > s.lastIndexOf(".")
      ? s.replace(/\./g, "").replace(",", ".") // 1.250.000,50
      : s.replace(/,/g, ""); // 1,250,000.50
  } else if (commas > 1) {
    s = s.replace(/,/g, "");
  } else if (commas === 1) {
    s = s.replace(",", ".");
  } else if (dots > 1) {
    s = s.replace(/\./g, "");
  } else if (dots === 1) {
    // Exactly 3 digits after a single dot with a non-zero integer part: Indonesian thousands (50.000)
    const [intPart, fracPart] = s.split(".");
    if (fracPart.length === 3 && Number(intPart) > 0) s = intPart + fracPart;
  }

  return s;
}

const INCOME_ALIASES = ["INCOME", "PEMASUKAN", "MASUK", "CR", "KREDIT", "CREDIT"];
const EXPENSE_ALIASES = ["EXPENSE", "PENGELUARAN", "KELUAR", "DB", "DEBIT", "DEBET"];

/**
 * Normalize transaction type; unknown or empty values fall back to `fallback`.
 */
export function parseImportType(raw: string, fallback: TransactionType = "EXPENSE"): TransactionType {
  const s = raw.trim().toUpperCase();
  if (INCOME_ALIASES.includes(s)) return "INCOME";
  if (EXPENSE_ALIASES.includes(s)) return "EXPENSE";
  return fallback;
}
