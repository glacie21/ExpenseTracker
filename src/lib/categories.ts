import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@/types";

export interface DefaultCategoryItem {
  name: string;
  type: TransactionType;
  color: string;
}

export const DEFAULT_CATEGORIES: DefaultCategoryItem[] = [
  // Income categories
  { name: "Gaji", type: "INCOME", color: "#2b67a8" },
  { name: "Pekerjaan lepas", type: "INCOME", color: "#3d8a8a" },
  { name: "Usaha", type: "INCOME", color: "#5b5fa8" },
  { name: "Investasi", type: "INCOME", color: "#4f7d3a" },
  { name: "Pemasukan lain", type: "INCOME", color: "#75716a" },

  // Expense categories
  { name: "Makan & minum", type: "EXPENSE", color: "#c4532b" },
  { name: "Transportasi", type: "EXPENSE", color: "#5f8fb8" },
  { name: "Belanja", type: "EXPENSE", color: "#8a4f9e" },
  { name: "Tagihan", type: "EXPENSE", color: "#a8324a" },
  { name: "Hiburan", type: "EXPENSE", color: "#b8892b" },
  { name: "Kesehatan", type: "EXPENSE", color: "#8a9a2b" },
  { name: "Pendidikan", type: "EXPENSE", color: "#7a6a55" },
  { name: "Pengeluaran lain", type: "EXPENSE", color: "#75716a" },
];

/**
 * Ensure default categories exist for a given user.
 * Safe and idempotent: will not create duplicates.
 */
export async function ensureUserCategories(userId: string): Promise<void> {
  const existingCount = await prisma.category.count({
    where: { userId },
  });

  if (existingCount === 0) {
    // Bulk create default categories for this user
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((cat) => ({
        userId,
        name: cat.name,
        type: cat.type,
        color: cat.color,
      })),
      skipDuplicates: true,
    });
  }
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
