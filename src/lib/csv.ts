/**
 * Minimal RFC 4180 CSV writer and parser with spreadsheet formula-injection protection.
 * This module has no external dependencies so it can be unit-tested directly with Node.
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

/**
 * Unescape a CSV field: trims surrounding whitespace and strips leading
 * apostrophe if it was added for spreadsheet formula protection.
 */
export function cleanCsvField(field: string): string {
  let val = field.trim();
  if (val.startsWith("'") && FORMULA_PREFIX.test(val.slice(1))) {
    val = val.slice(1).trim();
  }
  return val;
}

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
  /** App-generated values (dates, amounts) skip formula escaping. */
  trusted?: boolean;
}

/** UTF-8 byte order mark so Excel opens the file with the right encoding. */
export const CSV_BOM = "\uFEFF";

export function csvHeader<T>(columns: CsvColumn<T>[]): string {
  return columns.map((c) => escapeCsvField(c.header, true)).join(",") + "\r\n";
}

export function csvRows<T>(columns: CsvColumn<T>[], rows: T[]): string {
  return rows
    .map((row) => columns.map((c) => escapeCsvField(c.value(row), c.trusted)).join(",") + "\r\n")
    .join("");
}

/** Semicolon is common in Indonesian/European Excel exports; pick whichever the header uses more. */
function detectDelimiter(text: string): "," | ";" {
  let commas = 0;
  let semicolons = 0;
  let inQuotes = false;
  for (const ch of text) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes) {
      if (ch === "\n" || ch === "\r") break;
      if (ch === ",") commas++;
      else if (ch === ";") semicolons++;
    }
  }
  return semicolons > commas ? ";" : ",";
}

/**
 * RFC 4180 CSV parser. Handles comma or semicolon delimiters, quotes,
 * escaped quotes (""), multi-line fields and a leading UTF-8 BOM.
 * Fields are returned as-is; callers decide how to clean them (see cleanCsvField).
 */
export function parseCsv(raw: string): string[][] {
  const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  if (!text.trim()) return [];

  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char !== '"') field += char;
      else if (text[i + 1] === '"') {
        field += '"';
        i++;
      } else inQuotes = false;
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\r" || char === "\n") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  // Last row has no trailing newline; skip it when it is only a stray empty line
  row.push(field);
  if (row.some((cell) => cell.length > 0)) rows.push(row);

  return rows;
}
