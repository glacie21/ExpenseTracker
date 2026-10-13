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
      <div className="grid grid-cols-2 rounded-sm border border-rule p-0.5">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-[1px] py-2 text-sm transition-colors ${
              value === option.value ? "bg-ink font-medium text-paper" : "text-ink-2 hover:bg-sunken hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
