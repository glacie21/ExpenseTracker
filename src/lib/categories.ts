import { prisma } from "@/lib/prisma";
import { TransactionType } from "@/types";

export interface DefaultCategoryItem {
  name: string;
  type: TransactionType;
  color: string;
}

export const DEFAULT_CATEGORIES: DefaultCategoryItem[] = [
  // Income categories
  { name: "Salary", type: "INCOME", color: "#10b981" },
  { name: "Freelance", type: "INCOME", color: "#06b6d4" },
  { name: "Business", type: "INCOME", color: "#3b82f6" },
  { name: "Investment", type: "INCOME", color: "#8b5cf6" },
  { name: "Other Income", type: "INCOME", color: "#64748b" },

  // Expense categories
  { name: "Food & Drink", type: "EXPENSE", color: "#f97316" },
  { name: "Transportation", type: "EXPENSE", color: "#3b82f6" },
  { name: "Shopping", type: "EXPENSE", color: "#ec4899" },
  { name: "Bills", type: "EXPENSE", color: "#ef4444" },
  { name: "Entertainment", type: "EXPENSE", color: "#a855f7" },
  { name: "Health", type: "EXPENSE", color: "#14b8a6" },
  { name: "Education", type: "EXPENSE", color: "#eab308" },
  { name: "Other Expense", type: "EXPENSE", color: "#64748b" },
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
