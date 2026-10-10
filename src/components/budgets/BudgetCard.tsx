import React from "react";
import { AlertOctagon, AlertTriangle, CheckCircle2, Edit2, Trash2 } from "lucide-react";
import { formatRupiah } from "@/lib/formatters";
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
  { label: string; icon: typeof CheckCircle2; text: string; bar: string; badge: string }
> = {
  ok: {
    label: "Aman",
    icon: CheckCircle2,
    text: "text-emerald-700 dark:text-emerald-400",
    bar: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  },
  warning: {
    label: "Mendekati batas",
    icon: AlertTriangle,
    text: "text-amber-700 dark:text-amber-400",
    bar: "bg-amber-500",
    badge: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  },
  reached: {
    label: "Anggaran habis",
    icon: AlertOctagon,
    text: "text-orange-700 dark:text-orange-400",
    bar: "bg-orange-500",
    badge: "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
  },
  over: {
    label: "Over budget",
    icon: AlertOctagon,
    text: "text-rose-700 dark:text-rose-400",
    bar: "bg-rose-600",
    badge: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
  },
};

interface BudgetCardProps {
  budget: BudgetView;
  onEdit: (budget: BudgetView) => void;
  onDelete: (budget: BudgetView) => void;
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const status = BUDGET_STATUS[budget.status];
  const Icon = status.icon;
  const isOver = budget.status === "over";
  // Bar is capped at the track width; above 100% the budget mark moves left so
  // the overflow stays visible without breaking the layout.
  const scale = Math.max(100, budget.percent);
  const fillWidth = (Math.min(budget.percent, scale) / scale) * 100;
  const budgetMark = (100 / scale) * 100;

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: budget.category.color || "#64748b" }}
          />
          <h4 className="truncate font-semibold text-slate-900 dark:text-slate-100">{budget.category.name}</h4>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${status.badge}`}>
          <Icon className="h-3 w-3" aria-hidden="true" />
          {status.label}
        </span>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <span className="text-lg font-bold text-slate-900 dark:text-white">{formatRupiah(budget.spent)}</span>
          {" / "}
          {formatRupiah(budget.amount)}
        </p>
        <span className={`text-sm font-semibold ${status.text}`}>{formatPercent(budget.percent)}</span>
      </div>

      <div
        className="relative mt-2 h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800"
        role="progressbar"
        aria-valuemin={0}
        aria-valuenow={Math.round(budget.percent)}
        aria-valuetext={`${formatPercent(budget.percent)} dari anggaran terpakai`}
        aria-label={`Penggunaan anggaran ${budget.category.name}`}
      >
        <div className={`h-2.5 rounded-full ${status.bar}`} style={{ width: `${fillWidth}%` }} />
        {isOver && (
          <span
            className="absolute -top-1 h-4.5 w-0.5 bg-slate-900 dark:bg-white"
            style={{ left: `${budgetMark}%` }}
            title="Batas anggaran"
          />
        )}
      </div>

      <p className={`mt-2 text-xs ${isOver ? status.text : "text-slate-500 dark:text-slate-400"}`}>
        {isOver
          ? `Melebihi anggaran ${formatRupiah(-budget.remaining)}`
          : `Sisa ${formatRupiah(budget.remaining)}`}
      </p>

      <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
        <button
          type="button"
          onClick={() => onEdit(budget)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(budget)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Hapus
        </button>
      </div>
    </div>
  );
}
