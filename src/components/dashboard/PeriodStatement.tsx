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
  trends: { income: Trend; expense: Trend; netBalance: Trend };
  previousLabel: string;
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
}: PeriodStatementProps) {
  const net = income - expense;

  return (
    <section aria-labelledby="statement-heading" className="h-full rounded-sm border border-rule bg-surface">
      <div className="flex flex-col gap-0.5 border-b border-rule-soft px-5 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 sm:px-6">
        <h2 id="statement-heading" className="font-serif text-lg font-medium text-ink">
          Neraca periode
        </h2>
        <span className="text-xs text-ink-3">dibanding {previousLabel}</span>
      </div>

      <table className="w-full text-sm">
        <caption className="sr-only">
          Pemasukan, pengeluaran, dan saldo bersih periode ini dibanding {previousLabel}
        </caption>
        <tbody>
          <tr className="border-b border-rule-soft">
            <th scope="row" className="px-5 py-3.5 text-left font-normal sm:px-6">
              <span className="block text-ink">Pemasukan</span>
              <span className="block text-xs text-ink-3">{incomeCount} transaksi</span>
            </th>
            <td className="px-5 py-3.5 text-right align-top sm:px-6">
              <Amount value={income} className="block text-base" />
              <TrendLine {...trends.income} increaseIsGood />
            </td>
          </tr>
          <tr className="border-b border-rule-soft">
            <th scope="row" className="px-5 py-3.5 text-left font-normal sm:px-6">
              <span className="block text-ink">Pengeluaran</span>
              <span className="block text-xs text-ink-3">{expenseCount} transaksi</span>
            </th>
            <td className="px-5 py-3.5 text-right align-top sm:px-6">
              <Amount value={-expense} className="block text-base" />
              <TrendLine {...trends.expense} increaseIsGood={false} />
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
              <span className="mt-1 block">
                <TrendLine {...trends.netBalance} increaseIsGood />
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <p className="px-5 pt-2 pb-5 text-xs text-ink-3 sm:px-6">
        {income > 0 ? (
          <>
            Tingkat tabungan <span className="num text-sm text-ink">{formatPercent(savingsRate)}</span>{" "}
            dari pemasukan.
          </>
        ) : (
          "Tingkat tabungan belum bisa dihitung karena belum ada pemasukan."
        )}
      </p>
    </section>
  );
}
