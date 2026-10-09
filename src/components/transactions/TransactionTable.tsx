"use client";

import React from "react";
import { Transaction } from "@/types";
import { formatRupiah, formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Edit2,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Plus,
} from "lucide-react";

export interface TransactionTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onAddNew: () => void;
}

export function TransactionTable({
  transactions,
  isLoading,
  onEdit,
  onDelete,
  pagination,
  onPageChange,
  onAddNew,
}: TransactionTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800/60 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 mb-4">
          <Receipt className="h-7 w-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
          Tidak Ada Transaksi Ditemukan
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
          Belum ada catatan transaksi yang sesuai dengan filter atau pencarian Anda.
          Mulai catat transaksi pertama Anda sekarang.
        </p>
        <Button
          onClick={onAddNew}
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Tambah Transaksi Baru
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200/80 dark:bg-slate-950/50 dark:border-slate-800 dark:text-slate-400">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                Tanggal
              </th>
              <th scope="col" className="px-5 py-3.5">
                Transaksi
              </th>
              <th scope="col" className="px-5 py-3.5">
                Kategori
              </th>
              <th scope="col" className="px-5 py-3.5">
                Tipe
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                Nominal
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((tx) => {
              const isIncome = tx.type === "INCOME";
              const amountNum = typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount;

              return (
                <tr
                  key={tx.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Tanggal */}
                  <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(tx.date)}
                  </td>

                  {/* Transaksi (Nama & Deskripsi) */}
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {tx.title}
                      </span>
                      {tx.description && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs">
                          {tx.description}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Kategori */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: tx.category?.color || (isIncome ? "#10b981" : "#f97316"),
                        }}
                      />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {tx.category?.name || "Uncategorized"}
                      </span>
                    </div>
                  </td>

                  {/* Tipe Transaksi */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        isIncome
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                      )}
                      {isIncome ? "Income" : "Expense"}
                    </span>
                  </td>

                  {/* Nominal */}
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <span
                      className={`font-semibold tracking-tight ${
                        isIncome
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatRupiah(amountNum)}
                    </span>
                  </td>

                  {/* Aksi (Edit & Delete) */}
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(tx)}
                        title="Edit transaksi"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(tx)}
                        title="Hapus transaksi"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Menampilkan baris{" "}
          <strong className="text-slate-800 dark:text-slate-200">
            {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
          </strong>{" "}
          sampai{" "}
          <strong className="text-slate-800 dark:text-slate-200">
            {Math.min(pagination.page * pagination.limit, pagination.total)}
          </strong>{" "}
          dari{" "}
          <strong className="text-slate-800 dark:text-slate-200">
            {pagination.total}
          </strong>{" "}
          transaksi
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

          <span className="text-xs font-semibold px-2 text-slate-600 dark:text-slate-300">
            Halaman {pagination.page} / {pagination.totalPages}
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
