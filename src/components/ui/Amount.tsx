import React from "react";
import { formatRupiah } from "@/lib/formatters";

interface AmountProps {
  value: number;
  /** Signs the figure by direction: income "+", expense "−" in red ink. */
  type?: "INCOME" | "EXPENSE";
  className?: string;
}

/**
 * A money figure in the ledger style: serif tabular numerals; money going out
 * (an expense, or any negative value) is written in red ink, everything else
 * in black. The sign is always printed, so meaning never rests on color.
 */
export function Amount({ value, type, className = "" }: AmountProps) {
  let text: string;
  let negative: boolean;
  if (type) {
    negative = type === "EXPENSE";
    text = `${negative ? "−" : "+"}${formatRupiah(Math.abs(value))}`;
  } else {
    negative = value < 0;
    text = negative ? `−${formatRupiah(Math.abs(value))}` : formatRupiah(value);
  }

  return (
    <span className={`num whitespace-nowrap ${negative ? "text-neg" : "text-ink"} ${className}`}>
      {text}
    </span>
  );
}
