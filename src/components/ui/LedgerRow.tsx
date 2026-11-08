import React from "react";
import { Amount } from "@/components/ui/Amount";
import { CategoryMark } from "@/components/ui/CategoryMark";

interface LedgerRowProps {
  category?: string | null;
  color?: string | null;
  title: string;
  subtitle: React.ReactNode;
  amount: number;
  type: "INCOME" | "EXPENSE";
}

/** One line of a transaction list: category tile, title and details, signed amount. */
export function LedgerRow({ category, color, title, subtitle, amount, type }: LedgerRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-xl px-3 py-2.5">
      <CategoryMark name={category} color={color} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{title}</p>
        <p className="truncate text-xs text-ink-3">{subtitle}</p>
      </div>
      <Amount value={amount} type={type} className="text-sm font-semibold" />
    </li>
  );
}
