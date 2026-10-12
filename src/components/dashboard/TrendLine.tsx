import React from "react";
import { formatRupiahSigned } from "@/lib/formatters";
import { formatPercent } from "@/lib/finance";

interface TrendLineProps {
  difference: number;
  percent: number | null;
  /** true for income/net balance (up is good), false for expense (up is bad) */
  increaseIsGood: boolean;
}

/**
 * Change vs the previous period: arrow + signed amount + percentage. Never
 * relies on color alone; shows "belum ada pembanding" when the previous
 * period is zero instead of a misleading percentage.
 */
export function TrendLine({ difference, percent, increaseIsGood }: TrendLineProps) {
  if (percent === null) {
    return (
      <span className="text-xs text-ink-3">
        belum ada pembanding
        {difference !== 0 && <> ({formatRupiahSigned(difference)})</>}
      </span>
    );
  }

  const up = difference > 0;
  const flat = difference === 0;
  const good = flat ? null : up === increaseIsGood;
  const tone = good === null ? "text-ink-3" : good ? "text-pos" : "text-neg";
  const arrow = flat ? "=" : up ? "▲" : "▼";

  return (
    <span className={`num text-xs ${tone}`}>
      <span aria-hidden="true">{arrow} </span>
      {formatRupiahSigned(difference)} ({percent > 0 ? "+" : ""}
      {formatPercent(percent)})
    </span>
  );
}
