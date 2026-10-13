"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Amount } from "@/components/ui/Amount";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate } from "@/lib/formatters";
import { PaginatedTransactions, Transaction } from "@/types";

interface ReportTransactionsTableProps {
  transactions: Transaction[];
  pagination: PaginatedTransactions["pagination"];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onPageChange: (page: number) => void;
}

/** Read-only, server-paginated transaction list for reports. */
export function ReportTransactionsTable({
  transactions,
  pagination,
  isLoading,
  error,
  onRetry,
  onPageChange,
}: ReportTransactionsTableProps) {
  if (error && !isLoading) {
    return (
      <div role="alert" className="px-5 py-10 text-center sm:px-6">
        <p className="text-sm text-ink-2">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
            Coba lagi
          </Button>
        )}
      </div>
    );
  }

  if (isLoading && transactions.length === 0) {
    return (
      <div className="space-y-2 p-5 sm:p-6" aria-busy="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 animate-pulse rounded-sm bg-sunken" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="px-5 py-10 text-center sm:px-6">
        <p className="text-sm text-ink-2">Tidak ada transaksi yang cocok dengan filter ini.</p>
        <p className="mt-1 text-xs text-ink-3">Ubah periode atau filter untuk melihat data lain.</p>
      </div>
    );
  }

  return (
    <div className={isLoading ? "opacity-60 transition-opacity" : ""} aria-busy={isLoading}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Transaksi pada periode laporan</caption>
          <thead className="border-b border-rule text-xs text-ink-3">
            <tr>
              <th scope="col" className="py-3 pr-3 pl-5 font-normal sm:pl-6">
                Tanggal
              </th>
              <th scope="col" className="px-3 py-3 font-normal">
                Transaksi
              </th>
              <th scope="col" className="hidden px-3 py-3 font-normal sm:table-cell">
                Kategori
              </th>
              <th scope="col" className="py-3 pr-5 pl-3 text-right font-normal sm:pr-6">
                Nominal
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-rule-soft last:border-0">
                <td className="w-28 py-3 pr-3 pl-5 align-top font-mono text-xs whitespace-nowrap text-ink-3 sm:pl-6">
                  {formatDate(tx.date)}
                </td>
                <td className="px-3 py-3 align-top text-ink">
                  {tx.title}
                  <span className="block text-xs text-ink-3 sm:hidden">{tx.category?.name ?? "Tanpa kategori"}</span>
                </td>
                <td className="hidden px-3 py-3 align-top text-xs whitespace-nowrap text-ink-3 sm:table-cell">
                  {tx.category?.name ?? "Tanpa kategori"}
                </td>
                <td className="py-3 pr-5 pl-3 text-right align-top sm:pr-6">
                  <Amount value={Number(tx.amount)} type={tx.type} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  );
}
