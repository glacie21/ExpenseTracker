import type { Prisma } from "@prisma/client";

/**
 * Stable ordering for reading transactions in batches. Only type imports here,
 * so tests can load it directly with Node.
 */
export type SortDirection = "asc" | "desc";

/** id breaks ties, so that batches never skip or repeat a row. */
export function transactionOrder(sort: SortDirection): Prisma.TransactionOrderByWithRelationInput[] {
  return [{ date: sort }, { createdAt: sort }, { id: sort }];
}

/**
 * Rows after `last` in transactionOrder. Compares values rather than pointing
 * at the row (a Prisma cursor), so it keeps working if `last` has been deleted
 * in the meantime; a cursor on a deleted row returns nothing.
 */
export function transactionsAfter(
  last: { date: Date; createdAt: Date; id: string },
  sort: SortDirection
): Prisma.TransactionWhereInput {
  const past = sort === "asc" ? "gt" : "lt";
  return {
    OR: [
      { date: { [past]: last.date } },
      { date: last.date, createdAt: { [past]: last.createdAt } },
      { date: last.date, createdAt: last.createdAt, id: { [past]: last.id } },
    ],
  };
}
