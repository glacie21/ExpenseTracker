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
      <div className="flex h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-rule text-center">
        <PieChart className="mb-2 h-8 w-8 text-ink-3" />
        <p className="text-sm font-medium text-ink-2">
          Belum ada pengeluaran pada periode ini
        </p>
        <p className="mt-1 text-xs text-ink-3">
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
            className="relative rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="inline-flex min-w-0 items-center gap-2 text-ink">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-lg"
                  style={{ backgroundColor: item.color || NEUTRAL_CATEGORY_COLOR }}
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="num font-semibold text-ink">
                  {formatRupiah(item.total)}
                </span>
                <span className="ml-2 text-xs text-ink-3">
                  {formatPercent(item.percent)}
                </span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-sunken">
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
                className="pointer-events-none absolute right-0 top-full z-10 mt-1 rounded-xl border border-rule bg-surface px-3 py-1.5 text-xs shadow-[0_8px_20px_-10px_rgb(6_30_25/0.35)]"
              >
                <span className="num font-semibold text-ink">{item.count}</span>
                <span className="text-ink-3"> transaksi</span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
