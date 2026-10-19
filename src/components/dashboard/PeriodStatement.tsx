import React from "react";
import { Amount } from "@/components/ui/Amount";
import { Guilloche } from "@/components/ui/Guilloche";
import { formatRupiah } from "@/lib/formatters";
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

/** The net figure with a smaller "Rp", as printed on a note. */
function NoteFigure({ value }: { value: number }) {
  const text = formatRupiah(Math.abs(value)).replace(/^Rp/, "");
  return (
    <p className="num font-display text-[2.5rem] leading-none font-semibold sm:text-5xl">
      {value < 0 && (
        <>
          <span className="sr-only">minus </span>
          <span aria-hidden="true">−</span>
        </>
      )}
      <span className="mr-1 align-[0.55em] text-lg font-medium sm:text-xl">Rp</span>
      {text}
    </p>
  );
}

/**
 * The period summary. The net result sits on a banknote-style panel (teal,
 * engraved line work); income, expense and the savings rate follow below it.
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
    <section
      aria-labelledby={headingId}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-rule bg-surface"
    >
      <div className="relative isolate overflow-hidden bg-note px-5 pt-5 pb-6 text-note-ink sm:px-6">
        <Guilloche className="absolute inset-0 -z-10 h-full w-full text-note-line" />
        <h2 id={headingId} className="text-sm font-medium">
          {title}
        </h2>
        {previousLabel && <p className="mt-0.5 max-w-[16rem] text-xs text-note-ink-2">dibanding {previousLabel}</p>}

        <p className="mt-8 text-sm text-note-ink-2">{net < 0 ? "Defisit" : "Saldo bersih"}</p>
        <div className="mt-1.5">
          <NoteFigure value={net} />
        </div>
        {trends && (
          <p className="mt-2">
            <TrendLine {...trends.netBalance} increaseIsGood onNote />
          </p>
        )}
      </div>

      <table className="w-full text-sm">
        <caption className="sr-only">
          Pemasukan dan pengeluaran{previousLabel ? ` dibanding ${previousLabel}` : ""}
        </caption>
        <tbody>
          <tr className="border-b border-rule-soft">
            <th scope="row" className="px-5 py-4 text-left font-normal sm:px-6">
              <span className="block font-medium text-ink">Pemasukan</span>
              <span className="block text-xs text-ink-3">{incomeCount} transaksi</span>
            </th>
            <td className="px-5 py-4 text-right align-top sm:px-6">
              <Amount value={income} className="block text-base font-semibold" />
              {trends && <TrendLine {...trends.income} increaseIsGood />}
            </td>
          </tr>
          <tr>
            <th scope="row" className="px-5 py-4 text-left font-normal sm:px-6">
              <span className="block font-medium text-ink">Pengeluaran</span>
              <span className="block text-xs text-ink-3">{expenseCount} transaksi</span>
            </th>
            <td className="px-5 py-4 text-right align-top sm:px-6">
              <Amount value={-expense} className="block text-base font-semibold" />
              {trends && <TrendLine {...trends.expense} increaseIsGood={false} />}
            </td>
          </tr>
        </tbody>
      </table>

      <dl className="mt-auto space-y-2 bg-sunken/60 px-5 py-4 text-sm sm:px-6">
        <StatementRow label="Tingkat tabungan">
          {income > 0 ? <span className="num font-medium">{formatPercent(savingsRate)}</span> : "belum ada pemasukan"}
        </StatementRow>
        {children}
      </dl>
    </section>
  );
}
