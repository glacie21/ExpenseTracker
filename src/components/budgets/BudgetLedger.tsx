import React from "react";
import { AlertOctagon, AlertTriangle, Check, Pencil, Trash2 } from "lucide-react";
import { Amount } from "@/components/ui/Amount";
import { BudgetStatus, formatPercent } from "@/lib/finance";

export interface BudgetView {
  id: string;
  categoryId: string;
  category: { id: string; name: string; color: string | null };
  month: number;
  year: number;
  amount: number;
  spent: number;
  remaining: number;
  percent: number;
  status: BudgetStatus;
}

// Status always pairs color with an icon and a text label
export const BUDGET_STATUS: Record<
  BudgetStatus,
  { label: string; icon: typeof Check; text: string; bar: string }
> = {
  ok: { label: "Aman", icon: Check, text: "text-ink-3", bar: "bg-accent" },
  warning: { label: "Mendekati batas", icon: AlertTriangle, text: "text-warn", bar: "bg-warn" },
  reached: { label: "Habis", icon: AlertOctagon, text: "text-warn", bar: "bg-warn" },
  over: { label: "Terlampaui", icon: AlertOctagon, text: "text-neg", bar: "bg-neg" },
};

function UsageBar({ budget }: { budget: BudgetView }) {
  const status = BUDGET_STATUS[budget.status];
  // Above 100% the budget mark moves left so the overflow stays visible
  const scale = Math.max(100, budget.percent);
  const fillWidth = (Math.min(budget.percent, scale) / scale) * 100;
  const budgetMark = (100 / scale) * 100;

  return (
    <div
      className="relative h-1.5 w-full bg-sunken"
      role="progressbar"
      aria-valuemin={0}
      aria-valuenow={Math.round(budget.percent)}
      aria-valuetext={`${formatPercent(budget.percent)} dari anggaran terpakai`}
      aria-label={`Pemakaian anggaran ${budget.category.name}`}
    >
      <div className={`h-1.5 ${status.bar}`} style={{ width: `${fillWidth}%` }} />
      {budget.status === "over" && (
        <span
          className="absolute -top-1 h-3.5 w-px bg-ink"
          style={{ left: `${budgetMark}%` }}
          title="Batas anggaran"
        />
      )}
    </div>
  );
}

function StatusLabel({ budget }: { budget: BudgetView }) {
  const status = BUDGET_STATUS[budget.status];
  const Icon = status.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${status.text}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {status.label}
      <span className="num text-sm">{formatPercent(budget.percent)}</span>
    </span>
  );
}

interface BudgetLedgerProps {
  budgets: BudgetView[];
  totals: { amount: number; spent: number; remaining: number; percent: number };
  periodLabel: string;
  onEdit: (budget: BudgetView) => void;
  onDelete: (budget: BudgetView) => void;
}

/**
 * The month's budgets as one ledger: limit, spent and what is left per
 * category, closed by a totals row under a double rule.
 */
export function BudgetLedger({ budgets, totals, periodLabel, onEdit, onDelete }: BudgetLedgerProps) {
  return (
    <div className="rounded-sm border border-rule bg-surface">
      <table className="w-full text-sm">
        <caption className="sr-only">Anggaran {periodLabel}</caption>
        <thead className="border-b border-rule text-xs text-ink-3">
          <tr>
            <th scope="col" className="py-3 pr-3 pl-5 text-left font-normal sm:pl-6">
              Kategori
            </th>
            <th scope="col" className="hidden px-3 py-3 text-right font-normal md:table-cell">
              Batas
            </th>
            <th scope="col" className="hidden px-3 py-3 text-right font-normal md:table-cell">
              Terpakai
            </th>
            <th scope="col" className="px-3 py-3 text-right font-normal">
              Sisa
            </th>
            <th scope="col" className="hidden w-48 px-3 py-3 text-left font-normal md:table-cell">
              Pemakaian
            </th>
            <th scope="col" className="py-3 pr-5 pl-1 sm:pr-6">
              <span className="sr-only">Aksi</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {budgets.map((budget) => (
            <tr key={budget.id} className="border-b border-rule-soft">
              <th scope="row" className="py-3.5 pr-3 pl-5 text-left font-normal sm:pl-6">
                <span className="inline-flex items-center gap-2 text-ink">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: budget.category.color || "var(--ink-3)" }}
                    aria-hidden="true"
                  />
                  {budget.category.name}
                </span>
                {/* Below md the spent/limit figures and the bar sit under the name */}
                <span className="mt-1 block text-xs text-ink-3 md:hidden">
                  <Amount value={budget.spent} className="text-ink-2" /> dari{" "}
                  <Amount value={budget.amount} className="text-ink-2" />
                </span>
                <span className="mt-2 block md:hidden">
                  <UsageBar budget={budget} />
                  <span className="mt-1.5 block">
                    <StatusLabel budget={budget} />
                  </span>
                </span>
              </th>
              <td className="hidden px-3 py-3.5 text-right md:table-cell">
                <Amount value={budget.amount} />
              </td>
              <td className="hidden px-3 py-3.5 text-right md:table-cell">
                <Amount value={budget.spent} />
              </td>
              <td className="px-3 py-3.5 text-right align-top md:align-middle">
                <Amount value={budget.remaining} />
              </td>
              <td className="hidden px-3 py-3.5 md:table-cell">
                <UsageBar budget={budget} />
                <span className="mt-1.5 block">
                  <StatusLabel budget={budget} />
                </span>
              </td>
              <td className="py-2.5 pr-3 pl-0 text-right align-top whitespace-nowrap sm:pr-5 md:align-middle">
                <button
                  type="button"
                  onClick={() => onEdit(budget)}
                  aria-label={`Ubah anggaran ${budget.category.name}`}
                  title="Ubah"
                  className="rounded-sm p-1.5 text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(budget)}
                  aria-label={`Hapus anggaran ${budget.category.name}`}
                  title="Hapus"
                  className="rounded-sm p-1.5 text-ink-3 transition-colors hover:bg-neg-soft hover:text-neg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="py-4 pr-3 pl-5 text-left font-medium text-ink sm:pl-6">
              Jumlah
              <span className="mt-1 block text-xs font-normal text-ink-3 md:hidden">
                <Amount value={totals.spent} className="text-sm text-ink-2" /> dari{" "}
                <Amount value={totals.amount} className="text-sm text-ink-2" />
              </span>
            </th>
            <td className="hidden px-3 py-4 text-right md:table-cell">
              <Amount value={totals.amount} className="font-semibold" />
            </td>
            <td className="hidden px-3 py-4 text-right md:table-cell">
              <Amount value={totals.spent} className="font-semibold" />
            </td>
            <td className="px-3 py-4 text-right">
              <span className="rule-total inline-block pb-0.5">
                <Amount value={totals.remaining} className="text-base font-semibold" />
              </span>
            </td>
            <td className="hidden px-3 py-4 text-xs text-ink-3 md:table-cell" colSpan={2}>
              <span className="num text-sm text-ink">{formatPercent(totals.percent)}</span> dari total
              batas terpakai
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
