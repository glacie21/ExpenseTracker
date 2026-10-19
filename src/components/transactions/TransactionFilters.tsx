"use client";

import React from "react";
import { Category, TransactionType } from "@/types";
import { Search } from "lucide-react";
import { FIELD_SM, FILTER_LABEL, tabClass } from "@/components/ui/fieldStyles";
import { MONTH_NAMES } from "@/lib/dates";
import { categoryOptionLabel } from "@/lib/formatters";

const TYPE_TABS: { value: "ALL" | TransactionType; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "INCOME", label: "Pemasukan" },
  { value: "EXPENSE", label: "Pengeluaran" },
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
  /** Rendered at the right end of the type tabs row. */
  actions?: React.ReactNode;
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
  actions,
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
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-sunken p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Tipe transaksi">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={type === tab.value}
              onClick={() => {
                onTypeChange(tab.value);
                onCategoryChange("");
              }}
              className={tabClass(type === tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-3" />
        <input
          type="search"
          placeholder="Cari judul atau deskripsi"
          aria-label="Cari transaksi"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 w-full rounded-lg border border-rule bg-surface pr-3 pl-9 text-sm text-ink placeholder:text-ink-3 hover:border-ink-3 focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="filter-category" className={FILTER_LABEL}>
            Kategori
          </label>
          <select
            id="filter-category"
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={FIELD_SM}
          >
            <option value="">Semua kategori</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {categoryOptionLabel(c, type)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-start-date" className={FILTER_LABEL}>
            Dari tanggal
          </label>
          <input
            id="filter-start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className={FIELD_SM}
          />
        </div>

        <div>
          <label htmlFor="filter-end-date" className={FILTER_LABEL}>
            Sampai tanggal
          </label>
          <input
            id="filter-end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className={FIELD_SM}
          />
        </div>

        <div>
          <label htmlFor="filter-year" className={FILTER_LABEL}>
            Tahun
          </label>
          <select
            id="filter-year"
            value={year}
            onChange={(e) => {
              onYearChange(e.target.value);
              if (!e.target.value) onMonthChange("");
            }}
            className={FIELD_SM}
          >
            <option value="">Semua tahun</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-month" className={FILTER_LABEL}>
            Bulan
          </label>
          <select
            id="filter-month"
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            disabled={!year}
            title={!year ? "Pilih tahun terlebih dahulu" : undefined}
            className={FIELD_SM}
          >
            <option value="">Semua bulan</option>
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={String(index + 1)}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="filter-sort" className={FILTER_LABEL}>
            Urutan
          </label>
          <select
            id="filter-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as "newest" | "oldest")}
            className={FIELD_SM}
          >
            <option value="newest">Terbaru dulu</option>
            <option value="oldest">Terlama dulu</option>
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-ink-2 underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink"
        >
          Hapus semua filter
        </button>
      )}
    </div>
  );
}
