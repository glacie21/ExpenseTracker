import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@/types";

export interface DefaultCategoryItem {
  name: string;
  type: TransactionType;
  color: string;
}

export { DEFAULT_CATEGORY_COLOR } from "@/lib/categoryColors";

/** Catch-all default category per type, e.g. for imported rows without a category. */
export const FALLBACK_CATEGORY_NAME: Record<TransactionType, string> = {
  INCOME: "Pemasukan lain",
  EXPENSE: "Pengeluaran lain",
};

export const DEFAULT_CATEGORIES: DefaultCategoryItem[] = [
  // Income categories
  { name: "Gaji", type: "INCOME", color: "#2b67a8" },
  { name: "Pekerjaan lepas", type: "INCOME", color: "#3d8a8a" },
  { name: "Usaha", type: "INCOME", color: "#5b5fa8" },
  { name: "Investasi", type: "INCOME", color: "#4f7d3a" },
  { name: FALLBACK_CATEGORY_NAME.INCOME, type: "INCOME", color: "#75716a" },

  // Expense categories
  { name: "Makan & minum", type: "EXPENSE", color: "#c4532b" },
  { name: "Transportasi", type: "EXPENSE", color: "#5f8fb8" },
  { name: "Belanja", type: "EXPENSE", color: "#8a4f9e" },
  { name: "Tagihan", type: "EXPENSE", color: "#a8324a" },
  { name: "Hiburan", type: "EXPENSE", color: "#b8892b" },
  { name: "Kesehatan", type: "EXPENSE", color: "#8a9a2b" },
  { name: "Pendidikan", type: "EXPENSE", color: "#7a6a55" },
  { name: FALLBACK_CATEGORY_NAME.EXPENSE, type: "EXPENSE", color: "#75716a" },
];


/**
 * Another category of this user and type whose name matches case-insensitively
 * (the database unique constraint is case-sensitive). `exceptId` skips the
 * category being renamed.
 */
export function findCategoryNameConflict(userId: string, type: TransactionType, name: string, exceptId?: string) {
  return prisma.category.findFirst({
    where: {
      userId,
      type,
      name: { equals: name, mode: "insensitive" },
      ...(exceptId ? { NOT: { id: exceptId } } : {}),
    },
    select: { id: true },
  });
}

/** 409 for a category name that already exists for this user and type. */
export function duplicateCategoryResponse(name?: string, type?: TransactionType) {
  const typeLabel = type === "INCOME" ? "pemasukan" : type === "EXPENSE" ? "pengeluaran" : null;
  return NextResponse.json(
    {
      success: false,
      message:
        name && typeLabel
          ? `Kategori "${name}" untuk ${typeLabel} sudah ada.`
          : "Kategori dengan nama ini sudah ada.",
      errors: { name: "Nama kategori sudah ada untuk tipe ini" },
    },
    { status: 409 }
  );
}
