"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Receipt } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatRupiah } from "@/lib/formatters";
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
      <div className="space-y-2 p-5" aria-busy="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 rounded-lg bg-slate-100 animate-pulse dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
        <Receipt className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Tidak ada transaksi yang sesuai filter
        </p>
        <p className="mt-1 text-xs text-slate-400">Ubah periode atau filter untuk melihat data lain.</p>
      </div>
    );
  }

  return (
    <div className={isLoading ? "opacity-60 transition-opacity" : ""} aria-busy={isLoading}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
            <tr>
              <th scope="col" className="px-5 py-3">Tanggal</th>
              <th scope="col" className="px-5 py-3">Transaksi</th>
              <th scope="col" className="px-5 py-3">Kategori</th>
              <th scope="col" className="px-5 py-3">Jenis</th>
              <th scope="col" className="px-5 py-3 text-right">Nominal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((tx) => {
              const isIncome = tx.type === "INCOME";
              return (
                <tr key={tx.id}>
                  <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(tx.date)}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{tx.title}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-xs">{tx.category?.name ?? "-"}</td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <Badge variant={isIncome ? "success" : "danger"}>{isIncome ? "Income" : "Expense"}</Badge>
                  </td>
                  <td
                    className={`whitespace-nowrap px-5 py-3 text-right font-semibold ${
                      isIncome ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatRupiah(tx.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row dark:border-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {(pagination.page - 1) * pagination.limit + 1}–
          {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} transaksi
        </p>
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
          <span className="px-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {pagination.page} / {pagination.totalPages}
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
      </div>
    </div>
  );
}
