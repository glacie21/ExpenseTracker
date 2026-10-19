import React from "react";
import Link from "next/link";
import { Amount } from "@/components/ui/Amount";
import { CategoryMark } from "@/components/ui/CategoryMark";
import { formatDate } from "@/lib/formatters";
import { Transaction } from "@/types";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <section aria-labelledby="recent-heading" className="h-full rounded-2xl border border-rule bg-surface">
      <div className="flex items-baseline justify-between gap-4 px-5 pt-5 pb-2 sm:px-6">
        <h2 id="recent-heading" className="font-display text-lg font-semibold text-ink">
          Transaksi terakhir
        </h2>
        <Link
          href="/transactions"
          className="text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          Lihat semua
        </Link>
      </div>

      <ul className="px-2 pb-2 sm:px-3" aria-label="Lima transaksi terakhir dari semua periode">
        {transactions.map((tx) => (
          <li key={tx.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <CategoryMark name={tx.category?.name} color={tx.category?.color} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{tx.title}</p>
              <p className="truncate text-xs text-ink-3">
                {tx.category?.name ?? "Tanpa kategori"}, <span className="num">{formatDate(tx.date)}</span>
              </p>
            </div>
            <Amount value={Number(tx.amount)} type={tx.type} className="text-sm font-semibold" />
          </li>
        ))}
      </ul>
    </section>
  );
}
