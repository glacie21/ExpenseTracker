import React from "react";
import Link from "next/link";

/** "Catat pengeluaran" / "Catat pemasukan" links that open the transaction form directly. */
export function QuickActions() {
  return (
    <>
      <Link
        href="/transactions?add=EXPENSE"
        className="inline-flex h-9 items-center rounded-sm bg-ink px-4 text-sm font-medium text-paper transition-colors hover:bg-ink/85"
      >
        Catat pengeluaran
      </Link>
      <Link
        href="/transactions?add=INCOME"
        className="inline-flex h-9 items-center rounded-sm border border-rule bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-sunken"
      >
        Catat pemasukan
      </Link>
    </>
  );
}
