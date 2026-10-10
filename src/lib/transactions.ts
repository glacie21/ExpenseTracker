import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseDateOnly } from "@/lib/dates";
import { normalizeAmount, validateTransactionInput } from "@/lib/validations";
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

/**
 * Convert Prisma Decimal amount to a JSON-safe number for the client.
 */
export function serializeTransaction<T extends { amount: Prisma.Decimal }>(
  transaction: T
): Omit<T, "amount"> & { amount: number } {
  return { ...transaction, amount: transaction.amount.toNumber() };
}
