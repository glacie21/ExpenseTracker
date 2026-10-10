"use client";

import React from "react";
import { Category, TransactionType } from "@/types";
import { Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export interface TransactionFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  type: "ALL" | TransactionType;
  onTypeChange: (value: "ALL" | TransactionType) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  month: string;
  onMonthChange: (value: string) => void;
  year: string;
  onYearChange: (value: string) => void;
  sort: "newest" | "oldest";
  onSortChange: (value: "newest" | "oldest") => void;
  categories: Category[];
  onReset: () => void;
}

export function TransactionFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  categoryId,
  onCategoryChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  month,
  onMonthChange,
  year,
  onYearChange,
  sort,
  onSortChange,
  categories,
  onReset,
}: TransactionFiltersProps) {
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 7 }, (_, i) => String(currentYear + 1 - i));
  if (year && !yearOptions.includes(year)) yearOptions.push(year);

  // Filter kategori berdasarkan tipe yang dipilih (jika bukan ALL)
  const filteredCategories =
    type === "ALL"
      ? categories
      : categories.filter((c) => c.type === type);

  const hasActiveFilters =
    Boolean(search) ||
    type !== "ALL" ||
    Boolean(categoryId) ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    Boolean(month) ||
    Boolean(year) ||
    sort !== "newest";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Top Row: Search and Quick Type Tabs */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi berdasarkan nama atau deskripsi..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              onTypeChange("ALL");
              onCategoryChange("");
            }}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              type === "ALL"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => {
              onTypeChange("INCOME");
              onCategoryChange("");
            }}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              type === "INCOME"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                : "text-slate-600 hover:text-emerald-700 dark:text-slate-400"
            }`}
          >
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => {
              onTypeChange("EXPENSE");
              onCategoryChange("");
            }}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              type === "EXPENSE"
                ? "bg-rose-600 text-white shadow-sm shadow-rose-500/20"
                : "text-slate-600 hover:text-rose-700 dark:text-slate-400"
            }`}
          >
            Pengeluaran
          </button>
        </div>
      </div>

      {/* Bottom Row: Category, Date Range, Sort & Reset */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        {/* Category Select */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Kategori
          </label>
          <select
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="">Semua Kategori</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Dari Tanggal
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>

        {/* Year */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Tahun
          </label>
          <select
            value={year}
            onChange={(e) => {
              onYearChange(e.target.value);
              if (!e.target.value) onMonthChange("");
            }}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="">Semua Tahun</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Month (requires year) */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Bulan
          </label>
          <select
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            disabled={!year}
            title={!year ? "Pilih tahun terlebih dahulu" : undefined}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="">Semua Bulan</option>
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={String(index + 1)}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort & Reset Actions */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Urutan
            </label>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as "newest" | "oldest")}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="newest">Terbaru (Newest)</option>
              <option value="oldest">Terlama (Oldest)</option>
            </select>
          </div>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReset}
              leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              className="h-[34px] px-2.5 text-xs text-slate-600 hover:text-slate-900"
              title="Reset Filter"
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
