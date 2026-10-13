import React from "react";
import { Amount } from "@/components/ui/Amount";
import { formatPercent } from "@/lib/finance";
import { TrendLine } from "@/components/dashboard/TrendLine";

interface Trend {
  difference: number;
  percent: number | null;
}

interface PeriodStatementProps {
  income: number;
  expense: number;
  incomeCount: number;
  expenseCount: number;
  savingsRate: number;
  /** Change against the previous period; omitted on reports. */
  trends?: { income: Trend; expense: Trend; netBalance: Trend };
  previousLabel?: string;
  title?: string;
  /** Extra label/value rows after the savings rate. */
  children?: React.ReactNode;
}

/** A label/value row in the statement footer. */
export function StatementRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-ink-3">{label}</dt>
      <dd className="min-w-0 truncate text-right text-ink">{children}</dd>
    </div>
  );
}

/**
 * The period summary written as a short statement: income, expense, and the
 * net result under a double rule, the way a ledger closes a page.
 */
export function PeriodStatement({
  income,
  expense,
  incomeCount,
  expenseCount,
  savingsRate,
  trends,
  previousLabel,
  title = "Neraca periode",
  children,
}: PeriodStatementProps) {
  const net = income - expense;
  const headingId = React.useId();

  return (
    <section aria-labelledby={headingId} className="h-full rounded-sm border border-rule bg-surface">
      <div className="flex flex-col gap-0.5 border-b border-rule-soft px-5 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 sm:px-6">
        <h2 id={headingId} className="font-serif text-lg font-medium text-ink">
          {title}
        </h2>
        {previousLabel && <span className="text-xs text-ink-3">dibanding {previousLabel}</span>}
      </div>

      <table className="w-full text-sm">
        <caption className="sr-only">
          Pemasukan, pengeluaran, dan saldo bersih{previousLabel ? ` dibanding ${previousLabel}` : ""}
        </caption>
        <tbody>
          <tr className="border-b border-rule-soft">
            <th scope="row" className="px-5 py-3.5 text-left font-normal sm:px-6">
              <span className="block text-ink">Pemasukan</span>
              <span className="block text-xs text-ink-3">{incomeCount} transaksi</span>
            </th>
            <td className="px-5 py-3.5 text-right align-top sm:px-6">
              <Amount value={income} className="block text-base" />
              {trends && <TrendLine {...trends.income} increaseIsGood />}
            </td>
          </tr>
          <tr className="border-b border-rule-soft">
            <th scope="row" className="px-5 py-3.5 text-left font-normal sm:px-6">
              <span className="block text-ink">Pengeluaran</span>
              <span className="block text-xs text-ink-3">{expenseCount} transaksi</span>
            </th>
            <td className="px-5 py-3.5 text-right align-top sm:px-6">
              <Amount value={-expense} className="block text-base" />
              {trends && <TrendLine {...trends.expense} increaseIsGood={false} />}
            </td>
          </tr>
          <tr>
            <th scope="row" className="px-5 pt-5 pb-2 text-left font-medium text-ink sm:px-6">
              {net < 0 ? "Defisit" : "Saldo bersih"}
            </th>
            <td className="px-5 pt-5 pb-2 text-right sm:px-6">
              <span className="rule-total inline-block pb-1">
                <Amount value={net} className="text-2xl font-semibold sm:text-3xl" />
              </span>
              {trends && (
                <span className="mt-1 block">
                  <TrendLine {...trends.netBalance} increaseIsGood />
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <dl className="mt-3 space-y-2 border-t border-rule-soft px-5 py-4 text-sm sm:px-6">
        <StatementRow label="Tingkat tabungan">
          {income > 0 ? <span className="num">{formatPercent(savingsRate)}</span> : "belum ada pemasukan"}
        </StatementRow>
        {children}
      </dl>
    </section>
  );
}
