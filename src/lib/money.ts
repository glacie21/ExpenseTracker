import { Prisma } from "@prisma/client";

/** Exact Decimal -> integer cents (amounts are Decimal(15,2)). */
export function decimalToCents(value: Prisma.Decimal | null | undefined): number {
  if (!value) return 0;
  return value.mul(100).toNumber();
}
