import React from "react";
import { formatRupiahSigned } from "@/lib/formatters";
import { formatPercent } from "@/lib/finance";

interface TrendLineProps {
  difference: number;
  percent: number | null;
  /** true for income/net balance (up is good), false for expense (up is bad) */
  increaseIsGood: boolean;
  /** Set on the teal banknote panel, where green/red ink would not read. */
  onNote?: boolean;
}

/**
 * Change vs the previous period: arrow + signed amount + percentage. Never
 * relies on color alone; shows "belum ada pembanding" when the previous
 * period is zero instead of a misleading percentage.
 */
export function TrendLine({ difference, percent, increaseIsGood, onNote = false }: TrendLineProps) {
  const muted = onNote ? "text-note-ink-2" : "text-ink-3";

  if (percent === null) {
    return (
      <span className={`text-xs ${muted}`}>
        belum ada pembanding
        {difference !== 0 && <> ({formatRupiahSigned(difference)})</>}
      </span>
    );
  }

  const up = difference > 0;
  const flat = difference === 0;
  const good = flat ? null : up === increaseIsGood;
  const tone = onNote
    ? good === null
      ? muted
      : "text-note-ink"
    : good === null
      ? muted
      : good
        ? "text-pos"
        : "text-neg";
  const arrow = flat ? "=" : up ? "▲" : "▼";

  return (
    <span className={`num text-xs ${tone}`}>
      <span aria-hidden="true">{arrow} </span>
      {formatRupiahSigned(difference)} ({percent > 0 ? "+" : ""}
      {formatPercent(percent)})
    </span>
  );
}
