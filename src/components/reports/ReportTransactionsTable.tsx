"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Amount } from "@/components/ui/Amount";
import { formatDate } from "@/lib/formatters";
import { PaginatedTransactions, Transaction } from "@/types";

interface ReportTransactionsTableProps {
  transactions: Transaction[];
  pagination: PaginatedTransactions["pagination"];
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

/** Read-only, server-paginated transaction list for reports. */
export function ReportTransactionsTable({
  transactions,
  pagination,
  isLoading,
  onPageChange,
}: ReportTransactionsTableProps) {
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

      <div className="flex flex-col items-center justify-between gap-3 border-t border-rule px-5 py-3 sm:flex-row sm:px-6">
        <p className="text-xs text-ink-3">
          <span className="num text-sm text-ink">
            {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)}
          </span>{" "}
          dari <span className="num text-sm text-ink">{pagination.total}</span> transaksi
        </p>
        {pagination.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Sebelumnya
            </Button>
            <span className="px-1 text-xs text-ink-3">
              Hal. <span className="num text-sm text-ink">{pagination.page}</span> /{" "}
              <span className="num text-sm text-ink">{pagination.totalPages}</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Berikutnya
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
