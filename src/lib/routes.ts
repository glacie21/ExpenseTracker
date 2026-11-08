import type { TransactionType } from "@/types";

/** Opens the transactions page with the form ready for this type (see the page's `add` param). */
export function addTransactionHref(type: TransactionType): string {
  return `/transactions?add=${type}`;
}
