import { Prisma } from "@prisma/client";

/** A row with a Decimal `amount` as JSON-safe data (amount as a number). */
export function serializeAmount<T extends { amount: Prisma.Decimal }>(row: T): Omit<T, "amount"> & { amount: number } {
  return { ...row, amount: row.amount.toNumber() };
}

/** Exact Decimal -> integer cents (amounts are Decimal(15,2)). */
export function decimalToCents(value: Prisma.Decimal | null | undefined): number {
  if (!value) return 0;
  return value.mul(100).toNumber();
}
