import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cleanCsvField, parseCsv } from "@/lib/csv";
import { parseDateOnly } from "@/lib/dates";
import { DEFAULT_CATEGORY_COLOR, FALLBACK_CATEGORY_NAME } from "@/lib/categories";
import { normalizeAmount, validateCategoryInput, validateTransactionInput } from "@/lib/validations";
import { TransactionType } from "@/types";
import {
  detectHeaderIndices,
  ERROR_SAMPLE_LIMIT,
  ImportPreviewData,
  MAX_IMPORT_ROWS,
  normalizeImportDate,
  ParsedImportRow,
  parseImportAmount,
  parseImportType,
  PREVIEW_ROW_LIMIT,
} from "./transactionsImportUtils";

type CategoryClient = Pick<Prisma.TransactionClient, "category">;

/** Category names match case-insensitively within a type, like POST /api/categories. */
function categoryKey(type: string, name: string): string {
  return `${type}_${name.toLowerCase()}`;
}

async function loadCategoryMap(db: CategoryClient, userId: string): Promise<Map<string, string>> {
  const categories = await db.category.findMany({
    where: { userId },
    select: { id: true, name: true, type: true },
  });
  return new Map(categories.map((c) => [categoryKey(c.type, c.name.trim()), c.id]));
}

export type ParseImportResult =
  | { error: string }
  | { error?: undefined; data: ImportPreviewData; validRows: ParsedImportRow[] };

/**
 * Parse and validate all rows of a CSV file for a given user against their database categories.
 */
export async function parseTransactionsCsv(csvContent: string, userId: string): Promise<ParseImportResult> {
  const rows = parseCsv(csvContent).map((row) => row.map(cleanCsvField));
  if (rows.length === 0) {
    return { error: "File CSV kosong atau tidak memiliki data." };
  }

  const headerCheck = detectHeaderIndices(rows[0]);
  if (!headerCheck.indices) {
    return { error: headerCheck.error ?? "Header CSV tidak valid." };
  }
  const { dateCol, titleCol, typeCol, categoryCol, amountCol, descCol } = headerCheck.indices;
  const cell = (row: string[], col: number) => (col === -1 ? "" : row[col] ?? "");

  const dataRows = rows.slice(1).filter((r) => r.some((c) => c.length > 0));
  if (dataRows.length === 0) {
    return { error: "Tidak ada baris transaksi yang ditemukan di bawah baris header." };
  }
  if (dataRows.length > MAX_IMPORT_ROWS) {
    return {
      error: `File memiliki ${dataRows.length} baris. Maksimal impor adalah ${MAX_IMPORT_ROWS} baris per transaksi.`,
    };
  }

  const categoryLookup = await loadCategoryMap(prisma, userId);
  const newCategories = new Map<string, { name: string; type: TransactionType }>();

  const parsedRows: ParsedImportRow[] = dataRows.map((row, i) => {
    const date = normalizeImportDate(cell(row, dateCol));
    const title = cell(row, titleCol);
    const amount = parseImportAmount(cell(row, amountCol));
    const type = parseImportType(cell(row, typeCol));
    const categoryName = cell(row, categoryCol) || FALLBACK_CATEGORY_NAME[type];
    // Long notes are cut rather than failing the whole row
    const description = cell(row, descCol).slice(0, 500) || null;

    // Same rules as the single-transaction form; the category is resolved by name, not id
    const { errors: txErrors } = validateTransactionInput({
      type,
      title,
      amount,
      date,
      description: description ?? undefined,
    });
    delete txErrors.categoryId;
    if (txErrors.date && !parseDateOnly(date)) {
      txErrors.date = "Format tanggal tidak valid (gunakan YYYY-MM-DD atau DD/MM/YYYY)";
    }
    const { errors: categoryErrors } = validateCategoryInput({ name: categoryName, type });
    const errors = [...Object.values(txErrors), ...Object.values(categoryErrors)];

    const key = categoryKey(type, categoryName);
    const isNewCategory = !categoryLookup.has(key);
    if (isNewCategory && errors.length === 0 && !newCategories.has(key)) {
      newCategories.set(key, { name: categoryName, type });
    }

    return {
      rowNumber: i + 2, // header is row 1
      date,
      title,
      type,
      categoryName,
      amount: normalizeAmount(amount) ?? "0",
      description,
      errors,
      isNewCategory,
    };
  });

  const validRows = parsedRows.filter((r) => r.errors.length === 0);
  const invalidRows = parsedRows.filter((r) => r.errors.length > 0);

  return {
    data: {
      totalRows: parsedRows.length,
      validCount: validRows.length,
      errorCount: invalidRows.length,
      newCategories: Array.from(newCategories.values()),
      previewRows: parsedRows.slice(0, PREVIEW_ROW_LIMIT),
      errorSamples: invalidRows
        .slice(0, ERROR_SAMPLE_LIMIT)
        .map((r) => ({ row: r.rowNumber, errors: r.errors })),
    },
    validRows,
  };
}

/**
 * Execute the database import for valid rows, creating any missing categories first.
 */
export async function executeTransactionsImport(
  validRows: ParsedImportRow[],
  userId: string
): Promise<{ importedCount: number; createdCategoriesCount: number }> {
  const missing = new Map<string, { name: string; type: TransactionType }>();
  for (const row of validRows) {
    if (row.isNewCategory) missing.set(categoryKey(row.type, row.categoryName), { name: row.categoryName, type: row.type });
  }

  return prisma.$transaction(async (tx) => {
    let createdCategoriesCount = 0;
    if (missing.size > 0) {
      const created = await tx.category.createMany({
        data: Array.from(missing.values(), (c) => ({ userId, ...c, color: DEFAULT_CATEGORY_COLOR })),
        skipDuplicates: true,
      });
      createdCategoriesCount = created.count;
    }

    const categoryMap = await loadCategoryMap(tx, userId);
    const result = await tx.transaction.createMany({
      data: validRows.map((r) => ({
        userId,
        categoryId: categoryMap.get(categoryKey(r.type, r.categoryName))!,
        type: r.type,
        title: r.title,
        amount: new Prisma.Decimal(r.amount),
        description: r.description,
        date: parseDateOnly(r.date)!,
      })),
    });

    return { importedCount: result.count, createdCategoriesCount };
  });
}
