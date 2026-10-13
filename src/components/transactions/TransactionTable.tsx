"use client";

import React from "react";
import { Transaction } from "@/types";
import { formatDate } from "@/lib/formatters";
import { Amount } from "@/components/ui/Amount";
import { Button } from "@/components/ui/Button";
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

export interface TransactionTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
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
  /** True when a search or filter is narrowing the list. */
  isFiltered?: boolean;
}

function CategoryLabel({ tx }: { tx: Transaction }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
      {tx.category?.color && (
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: tx.category.color }}
          aria-hidden="true"
        />
      )}
      {tx.category?.name ?? "Tanpa kategori"}
    </span>
  );
}

export function TransactionTable({
  transactions,
  isLoading,
  error,
  onRetry,
  onEdit,
  onDelete,
  pagination,
  onPageChange,
  onAddNew,
  isFiltered = false,
}: TransactionTableProps) {
  if (error && !isLoading) {
    return (
      <section className="rounded-sm border border-rule bg-surface px-6 py-12 text-center">
        <h2 className="font-serif text-lg text-ink">Transaksi gagal dimuat</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">{error}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="mt-5">
            Coba lagi
          </Button>
        )}
      </section>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-sm border border-rule bg-surface" aria-busy="true" aria-label="Memuat transaksi">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-rule-soft px-5 py-4 last:border-0 sm:px-6">
            <div className="h-3 w-20 animate-pulse rounded-sm bg-sunken" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-40 animate-pulse rounded-sm bg-sunken" />
              <div className="h-3 w-24 animate-pulse rounded-sm bg-sunken" />
            </div>
            <div className="h-3.5 w-24 animate-pulse rounded-sm bg-sunken" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <section className="rounded-sm border border-dashed border-rule px-6 py-12 text-center sm:py-16">
        {isFiltered ? (
          <>
            <h2 className="font-serif text-lg text-ink">Tidak ada transaksi yang cocok</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
              Coba kata kunci lain, atau longgarkan filter tanggal dan kategori.
            </p>
          </>
        ) : (
          <>
            <h2 className="font-serif text-lg text-ink">Belum ada transaksi</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
              Catat pemasukan atau pengeluaran pertama Anda. Semuanya akan muncul di sini.
            </p>
            <Button onClick={onAddNew} variant="primary" className="mt-5">
              Catat transaksi
            </Button>
          </>
        )}
      </section>
    );
  }

  const firstRow = (pagination.page - 1) * pagination.limit + 1;
  const lastRow = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="rounded-sm border border-rule bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Daftar transaksi</caption>
          <thead className="border-b border-rule text-xs text-ink-3">
            <tr>
              <th scope="col" className="hidden py-3 pl-5 font-normal sm:table-cell sm:pl-6">
                Tanggal
              </th>
              <th scope="col" className="py-3 pr-3 pl-5 font-normal sm:pl-3">
                Transaksi
              </th>
              <th scope="col" className="hidden px-3 py-3 font-normal md:table-cell">
                Kategori
              </th>
              <th scope="col" className="px-3 py-3 text-right font-normal">
                Nominal
              </th>
              <th scope="col" className="py-3 pr-5 pl-3 text-right font-normal sm:pr-6">
                <span className="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="group border-b border-rule-soft last:border-0 hover:bg-paper/60">
                <td className="hidden w-32 py-3.5 pl-5 align-top font-mono text-xs whitespace-nowrap text-ink-3 sm:table-cell sm:pl-6">
                  {formatDate(tx.date)}
                </td>
                <td className="py-3.5 pr-3 pl-5 align-top sm:pl-3">
                  <span className="block text-ink">{tx.title}</span>
                  {tx.description && (
                    <span className="block max-w-xs truncate text-xs text-ink-3">{tx.description}</span>
                  )}
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-3 md:hidden">
                    <span className="font-mono sm:hidden">{formatDate(tx.date)}</span>
                    <CategoryLabel tx={tx} />
                  </span>
                </td>
                <td className="hidden px-3 py-3.5 align-top whitespace-nowrap md:table-cell">
                  <CategoryLabel tx={tx} />
                </td>
                <td className="px-3 py-3.5 text-right align-top">
                  <Amount value={Number(tx.amount)} type={tx.type} />
                </td>
                <td className="py-2.5 pr-4 pl-1 text-right align-top whitespace-nowrap sm:pr-5">
                  <button
                    type="button"
                    onClick={() => onEdit(tx)}
                    aria-label={`Ubah ${tx.title}`}
                    title="Ubah"
                    className="rounded-sm p-1.5 text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(tx)}
                    aria-label={`Hapus ${tx.title}`}
                    title="Hapus"
                    className="rounded-sm p-1.5 text-ink-3 transition-colors hover:bg-neg-soft hover:text-neg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-rule px-5 py-3 sm:flex-row sm:px-6">
        <p className="text-xs text-ink-3">
          <span className="num text-sm text-ink">
            {firstRow}–{lastRow}
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
