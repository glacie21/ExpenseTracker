import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { endOfDayUTC, monthRangeUTC, parseDateOnly } from "@/lib/dates";
import { isValidId, normalizeAmount, validateTransactionInput } from "@/lib/validations";
import { TransactionType } from "@/types";

export const TRANSACTION_CATEGORY_SELECT = {
  id: true,
  name: true,
  type: true,
  color: true,
} as const;

export interface TransactionWriteData {
  type: TransactionType;
  title: string;
  amount: Prisma.Decimal;
  categoryId: string;
  description: string | null;
  date: Date;
}

type ParseResult =
  | { ok: true; data: TransactionWriteData }
  | { ok: false; status: number; message: string; errors?: Record<string, string> };

/**
 * Validate a create/update request body and check that the category belongs
 * to `userId` and matches the transaction type. Never trusts a client userId.
 */
export async function parseTransactionBody(body: unknown, userId: string): Promise<ParseResult> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, status: 400, message: "Data transaksi tidak valid" };
  }
  const input = body as Record<string, unknown>;

  const validation = validateTransactionInput(input as Parameters<typeof validateTransactionInput>[0]);
  if (!validation.isValid) {
    return {
      ok: false,
      status: 400,
      message: "Data transaksi tidak valid",
      errors: validation.errors,
    };
  }

  const type = input.type as TransactionType;
  const categoryId = (input.categoryId as string).trim();
  const description =
    typeof input.description === "string" && input.description.trim()
      ? input.description.trim()
      : null;

  // findFirst scoped by userId: another user's category behaves as "not found"
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
  });

  if (!category) {
    return {
      ok: false,
      status: 400,
      message: "Kategori tidak ditemukan atau Anda tidak memiliki akses ke kategori ini.",
      errors: { categoryId: "Kategori tidak valid" },
    };
  }

  if (category.type !== type) {
    return {
      ok: false,
      status: 400,
      message: `Kategori "${category.name}" adalah kategori ${category.type}, tidak dapat digunakan untuk transaksi ${type}.`,
      errors: { categoryId: "Tipe kategori tidak cocok dengan tipe transaksi" },
    };
  }

  return {
    ok: true,
    data: {
      type,
      title: (input.title as string).trim(),
      amount: new Prisma.Decimal(normalizeAmount(input.amount)!),
      categoryId,
      description,
      date: parseDateOnly(input.date)!,
    },
  };
}

type FilterResult =
  | { ok: true; where: Prisma.TransactionWhereInput; sort: "asc" | "desc" }
  | { ok: false; message: string };

/**
 * Build the Prisma filter for listing, reporting and exporting transactions
 * from query params. Always scoped to `userId` (taken from the session).
 *
 * Params: search, type (INCOME|EXPENSE|ALL), categoryId, startDate, endDate
 * (YYYY-MM-DD), year, month (1-12), sort (newest|oldest).
 */
export function buildTransactionFilter(userId: string, params: URLSearchParams): FilterResult {
  const search = params.get("search")?.trim().slice(0, 100) || "";
  const typeParam = params.get("type")?.trim() || "";
  const categoryId = params.get("categoryId")?.trim() || "";
  const startParam = params.get("startDate")?.trim() || "";
  const endParam = params.get("endDate")?.trim() || "";
  const yearParam = params.get("year")?.trim() || "";
  const monthParam = params.get("month")?.trim() || "";

  const where: Prisma.TransactionWhereInput = { userId };
  const dateFilters: Prisma.TransactionWhereInput[] = [];

  if (typeParam === "INCOME" || typeParam === "EXPENSE") {
    where.type = typeParam;
  } else if (typeParam && typeParam !== "ALL") {
    return { ok: false, message: "Filter tipe transaksi tidak valid." };
  }

  if (categoryId) {
    if (!isValidId(categoryId)) {
      return { ok: false, message: "Filter kategori tidak valid." };
    }
    where.categoryId = categoryId;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const startDate = startParam ? parseDateOnly(startParam) : null;
  const endDate = endParam ? parseDateOnly(endParam) : null;
  if ((startParam && !startDate) || (endParam && !endDate)) {
    return { ok: false, message: "Format tanggal filter tidak valid (gunakan YYYY-MM-DD)." };
  }
  if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
    return { ok: false, message: "Tanggal awal tidak boleh setelah tanggal akhir." };
  }
  if (startDate) dateFilters.push({ date: { gte: startDate } });
  if (endDate) dateFilters.push({ date: { lte: endOfDayUTC(endDate) } });

  if (yearParam) {
    const year = Number(yearParam);
    if (!Number.isInteger(year) || year < 1900 || year > 9999) {
      return { ok: false, message: "Filter tahun tidak valid." };
    }
    if (monthParam) {
      const month = Number(monthParam);
      if (!Number.isInteger(month) || month < 1 || month > 12) {
        return { ok: false, message: "Filter bulan tidak valid." };
      }
      dateFilters.push({ date: monthRangeUTC(year, month) });
    } else {
      dateFilters.push({
        date: { gte: monthRangeUTC(year, 1).gte, lte: monthRangeUTC(year, 12).lte },
      });
    }
  }

  if (dateFilters.length > 0) {
    where.AND = dateFilters;
  }

  return { ok: true, where, sort: params.get("sort") === "oldest" ? "asc" : "desc" };
}

/**
 * Convert Prisma Decimal amount to a JSON-safe number for the client.
 */
export function serializeTransaction<T extends { amount: Prisma.Decimal }>(
  transaction: T
): Omit<T, "amount"> & { amount: number } {
  return { ...transaction, amount: transaction.amount.toNumber() };
}
