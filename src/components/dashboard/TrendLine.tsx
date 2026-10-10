import React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { formatRupiahSigned } from "@/lib/formatters";
import { formatPercent } from "@/lib/finance";

interface TrendLineProps {
  difference: number;
  percent: number | null;
  /** true for income/net balance (up is good), false for expense (up is bad) */
  increaseIsGood: boolean;
}

/**
 * Change vs the previous period: icon + signed amount + percentage. Never
 * relies on color alone; shows "Belum ada data pembanding" when the previous
 * period is zero instead of a misleading percentage.
 */
export function TrendLine({ difference, percent, increaseIsGood }: TrendLineProps) {
  if (percent === null) {
    return (
      <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <Minus className="h-3.5 w-3.5" />
        Belum ada data pembanding
        {difference !== 0 && <span className="ml-1">({formatRupiahSigned(difference)})</span>}
      </p>
    );
  }

  const up = difference > 0;
  const flat = difference === 0;
  const good = flat ? null : up === increaseIsGood;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  const tone =
    good === null
      ? "text-slate-500 dark:text-slate-400"
      : good
        ? "text-emerald-700 dark:text-emerald-400"
        : "text-rose-700 dark:text-rose-400";

  return (
    <p className={`flex flex-wrap items-center gap-1 text-xs ${tone}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="font-semibold">{formatRupiahSigned(difference)}</span>
      <span>
        ({percent > 0 ? "+" : ""}
        {formatPercent(percent)})
      </span>
      <span className="text-slate-500 dark:text-slate-400">vs periode sebelumnya</span>
    </p>
  );
}
