"use client";

import React, { useState } from "react";
import { PieChart } from "lucide-react";
import { formatRupiah } from "@/lib/formatters";
import { formatPercent } from "@/lib/finance";
import { NEUTRAL_CATEGORY_COLOR } from "./chartTheme";

export interface BreakdownItem {
  categoryId: string;
  name: string;
  color: string | null;
  total: number;
  count: number;
  percent: number;
}

interface ExpenseBreakdownProps {
  items: BreakdownItem[];
  /** Larger lists fold the tail into "Lainnya". */
  maxItems?: number;
}

/**
 * Expense distribution as labelled horizontal bars (sorted, largest first).
 * Category name, amount and share are direct labels, so identity never
 * depends on the category color alone.
 */
export function ExpenseBreakdown({ items, maxItems = 8 }: ExpenseBreakdownProps) {
  const [active, setActive] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-center dark:border-slate-800">
        <PieChart className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Belum ada pengeluaran pada periode ini
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Distribusi per kategori akan tampil setelah pengeluaran dicatat.
        </p>
      </div>
    );
  }

  let rows = items;
  if (items.length > maxItems) {
    const head = items.slice(0, maxItems - 1);
    const tail = items.slice(maxItems - 1);
    rows = [
      ...head,
      {
        categoryId: "__other__",
        name: `Lainnya (${tail.length} kategori)`,
        color: NEUTRAL_CATEGORY_COLOR,
        total: tail.reduce((sum, i) => sum + i.total, 0),
        count: tail.reduce((sum, i) => sum + i.count, 0),
        percent: tail.reduce((sum, i) => sum + i.percent, 0),
      },
    ];
  }
  const maxPercent = Math.max(...rows.map((r) => r.percent));

  return (
    <ul className="space-y-3" aria-label="Distribusi pengeluaran per kategori">
      {rows.map((item) => {
        const isActive = active === item.categoryId;
        return (
          <li
            key={item.categoryId}
            tabIndex={0}
            onPointerEnter={() => setActive(item.categoryId)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(item.categoryId)}
            onBlur={() => setActive(null)}
            aria-label={`${item.name}: ${formatRupiah(item.total)}, ${formatPercent(item.percent)} dari total pengeluaran, ${item.count} transaksi`}
            className="relative rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          >
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="inline-flex min-w-0 items-center gap-2 text-slate-700 dark:text-slate-200">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color || NEUTRAL_CATEGORY_COLOR }}
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatRupiah(item.total)}
                </span>
                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                  {formatPercent(item.percent)}
                </span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-2 rounded-full transition-opacity ${active && !isActive ? "opacity-50" : ""}`}
                style={{
                  width: `${maxPercent > 0 ? Math.max(2, (item.percent / maxPercent) * 100) : 0}%`,
                  backgroundColor: item.color || NEUTRAL_CATEGORY_COLOR,
                }}
              />
            </div>
            {isActive && (
              <div
                role="status"
                className="pointer-events-none absolute right-0 top-full z-10 mt-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900"
              >
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatRupiah(item.total)}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {" "}· {formatPercent(item.percent)} · {item.count} transaksi
                </span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
