import React from "react";
import Link from "next/link";
import { Amount } from "@/components/ui/Amount";
import { formatDate } from "@/lib/formatters";
import { Transaction } from "@/types";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <section aria-labelledby="recent-heading" className="rounded-sm border border-rule bg-surface">
      <div className="flex items-baseline justify-between gap-4 border-b border-rule-soft px-5 py-4 sm:px-6">
        <h2 id="recent-heading" className="font-serif text-lg font-medium text-ink">
          Transaksi terakhir
        </h2>
        <Link
          href="/transactions"
          className="text-sm text-ink-2 underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink"
        >
          Lihat semua
        </Link>
      </div>

      <table className="w-full text-sm">
        <caption className="sr-only">Lima transaksi terakhir dari semua periode</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Tanggal</th>
            <th scope="col">Transaksi</th>
            <th scope="col">Nominal</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b border-rule-soft last:border-0">
              <td className="w-28 py-3 pl-5 align-top font-mono text-xs whitespace-nowrap text-ink-3 sm:pl-6">
                {formatDate(tx.date)}
              </td>
              <td className="py-3 pr-3">
                <span className="block text-ink">{tx.title}</span>
                <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-ink-3">
                  {tx.category?.color && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: tx.category.color }}
                      aria-hidden="true"
                    />
                  )}
                  {tx.category?.name ?? "Tanpa kategori"}
                </span>
              </td>
              <td className="py-3 pr-5 text-right align-top sm:pr-6">
                <Amount value={Number(tx.amount)} type={tx.type} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
