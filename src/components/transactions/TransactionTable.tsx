"use client";

import React from "react";
import { Transaction } from "@/types";
import { formatDate } from "@/lib/formatters";
import { Amount } from "@/components/ui/Amount";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { RowActions } from "@/components/ui/RowActions";
import { EmptyBlock, ErrorState } from "@/components/ui/States";

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
    return <ErrorState title="Transaksi gagal dimuat" message={error} onRetry={onRetry} />;
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
    return isFiltered ? (
      <EmptyBlock title="Tidak ada transaksi yang cocok">
        Coba kata kunci lain, atau longgarkan filter tanggal dan kategori.
      </EmptyBlock>
    ) : (
      <EmptyBlock
        title="Belum ada transaksi"
        action={
          <Button onClick={onAddNew} variant="primary">
            Catat transaksi
          </Button>
        }
      >
        Catat pemasukan atau pengeluaran pertama Anda. Semuanya akan muncul di sini.
      </EmptyBlock>
    );
  }

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
                  <RowActions label={tx.title} onEdit={() => onEdit(tx)} onDelete={() => onDelete(tx)} />
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
