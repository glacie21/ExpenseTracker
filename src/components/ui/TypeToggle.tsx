"use client";

import React from "react";
import { TransactionType } from "@/types";

const OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "EXPENSE", label: "Pengeluaran" },
  { value: "INCOME", label: "Pemasukan" },
];

/** Two-way expense/income switch used at the top of the transaction and category forms. */
export function TypeToggle({
  value,
  onChange,
  legend,
}: {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
  legend: string;
}) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-sunken p-1">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-lg py-2 text-sm transition-colors ${
              value === option.value ? "bg-surface font-medium text-ink shadow-[0_1px_2px_rgb(19_36_31/0.12)]" : "text-ink-2 hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
