"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, FileText } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Amount } from "@/components/ui/Amount";
import { FIELD_SM, FILTER_LABEL, tabClass } from "@/components/ui/fieldStyles";
import { ExpenseBreakdown, BreakdownItem } from "@/components/charts/ExpenseBreakdown";
import { ReportTransactionsTable } from "@/components/reports/ReportTransactionsTable";
import {
  DateRange,
  addDaysUTC,
  addMonthsUTC,
  monthRange,
  parseDateOnly,
  toDateOnlyString,
  todayLocalISO,
  validateCustomRange,
  weekRange,
  yearRange,
} from "@/lib/dates";
import { formatPercent } from "@/lib/finance";
import { formatRupiah } from "@/lib/formatters";
import { downloadFile } from "@/lib/download";
import { Category, PaginatedTransactions, Transaction, TransactionType } from "@/types";

type PeriodType = "week" | "month" | "year" | "custom";

const PERIOD_TABS: { value: PeriodType; label: string }[] = [
  { value: "week", label: "Mingguan" },
  { value: "month", label: "Bulanan" },
  { value: "year", label: "Tahunan" },
  { value: "custom", label: "Rentang tanggal" },
];

const PAGE_SIZE = 10;

interface ReportData {
  period: { label: string; previousLabel: string; start: string; end: string };
  summary: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    savingsRate: number;
    transactionCount: number;
    incomeCount: number;
    expenseCount: number;
  };
  topExpenseCategory: BreakdownItem | null;
  breakdown: BreakdownItem[];
  categoryIncreases: {
    categoryId: string;
    name: string;
    color: string | null;
    current: number;
    previous: number;
    difference: number;
    percent: number | null;
  }[];
}

function computeRange(periodType: PeriodType, anchor: string, start: string, end: string): DateRange | null {
  const anchorDate = parseDateOnly(anchor);
  if (periodType === "custom") return validateCustomRange(parseDateOnly(start), parseDateOnly(end));
  if (!anchorDate) return null;
  if (periodType === "week") return weekRange(anchorDate);
  if (periodType === "month") return monthRange(anchorDate);
  return yearRange(anchorDate);
}

function shiftAnchor(periodType: PeriodType, anchor: string, direction: 1 | -1): string {
  const date = parseDateOnly(anchor);
  if (!date) return anchor;
  if (periodType === "week") return toDateOnlyString(addDaysUTC(date, 7 * direction));
  if (periodType === "month") return toDateOnlyString(addMonthsUTC(date, direction));
  return toDateOnlyString(new Date(Date.UTC(date.getUTCFullYear() + direction, 0, 1)));
}

function ReportStatement({ report }: { report: ReportData }) {
  const { summary, topExpenseCategory } = report;
  const net = summary.netBalance;
  return (
    <section aria-labelledby="report-statement" className="h-full rounded-sm border border-rule bg-surface">
      <div className="border-b border-rule-soft px-5 py-4 sm:px-6">
        <h2 id="report-statement" className="font-serif text-lg font-medium text-ink">
          Neraca
        </h2>
      </div>
      <table className="w-full text-sm">
        <caption className="sr-only">Pemasukan, pengeluaran, dan saldo bersih {report.period.label}</caption>
        <tbody>
          <tr className="border-b border-rule-soft">
            <th scope="row" className="px-5 py-3.5 text-left font-normal sm:px-6">
              <span className="block text-ink">Pemasukan</span>
              <span className="block text-xs text-ink-3">{summary.incomeCount} transaksi</span>
            </th>
            <td className="px-5 py-3.5 text-right align-top sm:px-6">
              <Amount value={summary.totalIncome} className="text-base" />
            </td>
          </tr>
          <tr className="border-b border-rule-soft">
            <th scope="row" className="px-5 py-3.5 text-left font-normal sm:px-6">
              <span className="block text-ink">Pengeluaran</span>
              <span className="block text-xs text-ink-3">{summary.expenseCount} transaksi</span>
            </th>
            <td className="px-5 py-3.5 text-right align-top sm:px-6">
              <Amount value={-summary.totalExpense} className="text-base" />
            </td>
          </tr>
          <tr>
            <th scope="row" className="px-5 pt-5 pb-2 text-left font-medium text-ink sm:px-6">
              {net < 0 ? "Defisit" : "Saldo bersih"}
            </th>
            <td className="px-5 pt-5 pb-2 text-right sm:px-6">
              <span className="rule-total inline-block pb-1">
                <Amount value={net} className="text-2xl font-semibold" />
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <dl className="mt-3 space-y-2 border-t border-rule-soft px-5 py-4 text-sm sm:px-6">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-3">Tingkat tabungan</dt>
          <dd className="num text-ink">
            {summary.totalIncome > 0 ? formatPercent(summary.savingsRate) : "–"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="shrink-0 text-ink-3">Pengeluaran terbesar</dt>
          <dd className="min-w-0 truncate text-right text-ink">
            {topExpenseCategory ? (
              <>
                {topExpenseCategory.name}{" "}
                <span className="num text-ink-3">{formatPercent(topExpenseCategory.percent)}</span>
              </>
            ) : (
              "–"
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function ReportsView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [periodType, setPeriodType] = useState<PeriodType>(() => {
    const v = searchParams.get("periodType");
    return v === "week" || v === "year" || v === "custom" ? v : "month";
  });
  const [anchor, setAnchor] = useState(searchParams.get("anchor") || todayLocalISO());
  const [customStart, setCustomStart] = useState(searchParams.get("startDate") || "");
  const [customEnd, setCustomEnd] = useState(searchParams.get("endDate") || "");
  const [type, setType] = useState<"ALL" | TransactionType>(() => {
    const v = searchParams.get("type");
    return v === "INCOME" || v === "EXPENSE" ? v : "ALL";
  });
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "");
  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  // Range + query shared by summary, table, CSV and PDF so they always agree
  const { range, reportQuery } = useMemo(() => {
    const resolved = computeRange(periodType, anchor, customStart, customEnd);
    if (!resolved) return { range: null, reportQuery: null };
    const params = new URLSearchParams({
      startDate: toDateOnlyString(resolved.start),
      endDate: toDateOnlyString(resolved.end),
      periodType,
    });
    if (type !== "ALL") params.set("type", type);
    if (categoryId) params.set("categoryId", categoryId);
    return { range: resolved, reportQuery: params.toString() };
  }, [periodType, anchor, customStart, customEnd, type, categoryId]);

  // Keep the selection in the URL so a reload shows the same report
  useEffect(() => {
    const params = new URLSearchParams({ periodType });
    if (periodType === "custom") {
      if (customStart) params.set("startDate", customStart);
      if (customEnd) params.set("endDate", customEnd);
    } else {
      params.set("anchor", anchor);
    }
    if (type !== "ALL") params.set("type", type);
    if (categoryId) params.set("categoryId", categoryId);
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
  }, [periodType, anchor, customStart, customEnd, type, categoryId, pathname]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/categories", { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCategories(json.data.categories);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // Summary
  const summaryKey = `${reportQuery}#${reloadToken}`;
  const [summary, setSummary] = useState<{ key: string; data: ReportData | null; error: string | null } | null>(null);
  useEffect(() => {
    if (!reportQuery) return;
    const controller = new AbortController();
    fetch(`/api/reports?${reportQuery}`, { signal: controller.signal })
      .then(async (res) => ({ res, json: await res.json() }))
      .then(({ res, json }) =>
        setSummary({
          key: summaryKey,
          data: res.ok && json.success ? json.data : null,
          error: res.ok && json.success ? null : json.message || "Gagal memuat laporan.",
        })
      )
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setSummary({ key: summaryKey, data: null, error: "Terjadi gangguan jaringan saat memuat laporan." });
        }
      });
    return () => controller.abort();
  }, [reportQuery, summaryKey]);

  // Transactions table (server-paginated)
  const tableKey = `${summaryKey}#${page}`;
  const [table, setTable] = useState<{ key: string; data: PaginatedTransactions | null } | null>(null);
  useEffect(() => {
    if (!reportQuery) return;
    const controller = new AbortController();
    const params = new URLSearchParams(reportQuery);
    params.delete("periodType");
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    fetch(`/api/transactions?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => setTable({ key: tableKey, data: json.success ? json.data : null }))
      .catch((err) => {
        if (err?.name !== "AbortError") setTable({ key: tableKey, data: null });
      });
    return () => controller.abort();
  }, [reportQuery, page, tableKey]);

  const summaryLoading = summary?.key !== summaryKey;
  const report = summary?.data ?? null;
  const tableLoading = table?.key !== tableKey;

  const changeFilter =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const handleExport = async (format: "csv" | "pdf") => {
    if (!reportQuery) return;
    setExporting(format);
    try {
      let filename: string;
      if (format === "csv") {
        const params = new URLSearchParams(reportQuery);
        params.delete("periodType");
        filename = await downloadFile(`/api/transactions/export?${params.toString()}`, "transaksi.csv");
      } else {
        filename = await downloadFile(`/api/reports/pdf?${reportQuery}`, "laporan.pdf");
      }
      setFeedback({ type: "success", message: `File ${filename} berhasil diunduh.` });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Gagal mengunduh laporan.",
      });
    } finally {
      setExporting(null);
    }
  };

  const filteredCategories = type === "ALL" ? categories : categories.filter((c) => c.type === type);
  const inputClass = FIELD_SM;
  const labelClass = FILTER_LABEL;
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-rule md:flex-row md:items-end md:justify-between">
        <div
          className="-mb-px flex gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Jenis periode laporan"
        >
          {PERIOD_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={periodType === tab.value}
              onClick={() => {
                if (tab.value === "custom" && range && !customStart && !customEnd) {
                  setCustomStart(toDateOnlyString(range.start));
                  setCustomEnd(toDateOnlyString(range.end));
                }
                changeFilter(setPeriodType)(tab.value);
              }}
              className={tabClass(periodType === tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 pb-3">
          <Button
            variant="outline"
            onClick={() => handleExport("csv")}
            isLoading={exporting === "csv"}
            disabled={!reportQuery || exporting !== null}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Unduh CSV
          </Button>
          <Button
            variant="primary"
            onClick={() => handleExport("pdf")}
            isLoading={exporting === "pdf"}
            disabled={!reportQuery || exporting !== null}
            leftIcon={<FileText className="h-4 w-4" />}
          >
            Unduh PDF
          </Button>
        </div>
      </div>

      {feedback && (
        <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {periodType === "custom" ? (
            <>
              <div>
                <label htmlFor="report-start" className={labelClass}>Dari tanggal</label>
                <input
                  id="report-start"
                  type="date"
                  value={customStart}
                  onChange={(e) => changeFilter(setCustomStart)(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="report-end" className={labelClass}>Sampai tanggal</label>
                <input
                  id="report-end"
                  type="date"
                  value={customEnd}
                  onChange={(e) => changeFilter(setCustomEnd)(e.target.value)}
                  className={inputClass}
                />
              </div>
            </>
          ) : (
            <div className="sm:col-span-2">
              <label htmlFor="report-anchor" className={labelClass}>
                {periodType === "week" ? "Minggu (pilih tanggal mana saja)" : periodType === "month" ? "Bulan" : "Tahun"}
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Periode sebelumnya"
                  onClick={() => changeFilter(setAnchor)(shiftAnchor(periodType, anchor, -1))}
                  className="h-9 shrink-0 px-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {periodType === "week" && (
                  <input
                    id="report-anchor"
                    type="date"
                    value={anchor}
                    onChange={(e) => e.target.value && changeFilter(setAnchor)(e.target.value)}
                    className={inputClass}
                  />
                )}
                {periodType === "month" && (
                  <input
                    id="report-anchor"
                    type="month"
                    value={anchor.slice(0, 7)}
                    onChange={(e) => e.target.value && changeFilter(setAnchor)(`${e.target.value}-01`)}
                    className={inputClass}
                  />
                )}
                {periodType === "year" && (
                  <select
                    id="report-anchor"
                    value={anchor.slice(0, 4)}
                    onChange={(e) => changeFilter(setAnchor)(`${e.target.value}-01-01`)}
                    className={inputClass}
                  >
                    {Array.from(
                      new Set([...Array.from({ length: 8 }, (_, i) => String(currentYear + 1 - i)), anchor.slice(0, 4)])
                    ).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Periode berikutnya"
                  onClick={() => changeFilter(setAnchor)(shiftAnchor(periodType, anchor, 1))}
                  className="h-9 shrink-0 px-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="report-type" className={labelClass}>Tipe transaksi</label>
            <select
              id="report-type"
              value={type}
              onChange={(e) => {
                changeFilter(setType)(e.target.value as "ALL" | TransactionType);
                setCategoryId("");
              }}
              className={inputClass}
            >
              <option value="ALL">Semua</option>
              <option value="INCOME">Pemasukan</option>
              <option value="EXPENSE">Pengeluaran</option>
            </select>
          </div>
          <div>
            <label htmlFor="report-category" className={labelClass}>Kategori</label>
            <select
              id="report-category"
              value={categoryId}
              onChange={(e) => changeFilter(setCategoryId)(e.target.value)}
              className={inputClass}
            >
              <option value="">Semua kategori</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {type === "ALL" ? `${c.name} (${c.type === "INCOME" ? "pemasukan" : "pengeluaran"})` : c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!range && (
          <p className="text-xs text-neg">
            Pilih rentang tanggal yang valid (tanggal awal tidak setelah tanggal akhir, maksimal 5 tahun).
          </p>
        )}
        {report && (
          <p className="flex flex-wrap items-baseline gap-x-3">
            <span className="font-serif text-2xl text-ink">{report.period.label}</span>
            <span className="text-xs text-ink-3">dibanding {report.period.previousLabel}</span>
          </p>
        )}
      </div>

      {summary?.error && !summaryLoading ? (
        <section className="rounded-sm border border-rule bg-surface px-6 py-12 text-center">
          <h2 className="font-serif text-lg text-ink">Laporan gagal dimuat</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">{summary.error}</p>
          <Button variant="outline" onClick={() => setReloadToken((t) => t + 1)} className="mt-5">
            Coba lagi
          </Button>
        </section>
      ) : !report ? (
        <div className="h-72 animate-pulse rounded-sm border border-rule bg-surface" aria-busy="true" />
      ) : (
        <div className={`space-y-6 transition-opacity ${summaryLoading ? "opacity-50" : ""}`} aria-busy={summaryLoading}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <ReportStatement report={report} />
            </div>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Pengeluaran per kategori</CardTitle>
                <CardDescription>Diurutkan dari yang terbesar.</CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseBreakdown items={report.breakdown} />
              </CardContent>
            </Card>
          </div>

          <section aria-labelledby="increases-heading" className="rounded-sm border border-rule bg-surface">
            <div className="flex flex-col gap-0.5 border-b border-rule-soft px-5 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 sm:px-6">
              <h2 id="increases-heading" className="font-serif text-lg font-medium text-ink">
                Pengeluaran yang naik
              </h2>
              <span className="text-xs text-ink-3">dibanding {report.period.previousLabel}</span>
            </div>
            {report.categoryIncreases.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-3 sm:px-6">
                Tidak ada kategori yang pengeluarannya naik pada periode ini.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Kategori dengan kenaikan pengeluaran</caption>
                  <thead className="border-b border-rule text-xs text-ink-3">
                    <tr>
                      <th scope="col" className="py-3 pr-3 pl-5 text-left font-normal sm:pl-6">
                        Kategori
                      </th>
                      <th scope="col" className="hidden px-3 py-3 text-right font-normal sm:table-cell">
                        Sebelumnya
                      </th>
                      <th scope="col" className="hidden px-3 py-3 text-right font-normal sm:table-cell">
                        Periode ini
                      </th>
                      <th scope="col" className="py-3 pr-5 pl-3 text-right font-normal sm:pr-6">
                        Kenaikan
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.categoryIncreases.map((c) => (
                      <tr key={c.categoryId} className="border-b border-rule-soft last:border-0">
                        <th scope="row" className="py-3 pr-3 pl-5 text-left font-normal sm:pl-6">
                          <span className="inline-flex items-center gap-2 text-ink">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: c.color || "var(--ink-3)" }}
                              aria-hidden="true"
                            />
                            {c.name}
                          </span>
                          <span className="num block text-xs text-ink-3 sm:hidden">
                            {formatRupiah(c.previous)} → {formatRupiah(c.current)}
                          </span>
                        </th>
                        <td className="hidden px-3 py-3 text-right sm:table-cell">
                          <Amount value={c.previous} />
                        </td>
                        <td className="hidden px-3 py-3 text-right sm:table-cell">
                          <Amount value={c.current} />
                        </td>
                        <td className="py-3 pr-5 pl-3 text-right whitespace-nowrap sm:pr-6">
                          <span className="num text-neg">+{formatRupiah(c.difference)}</span>
                          <span className="block text-xs text-ink-3">
                            {c.percent === null ? "baru periode ini" : `+${formatPercent(c.percent)}`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Transaction Summary */}
      {range && (
        <Card>
          <CardHeader>
            <CardTitle>Rincian transaksi</CardTitle>
            <CardDescription>Sesuai periode dan filter di atas. CSV dan PDF memuat daftar yang sama.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ReportTransactionsTable
              transactions={(table?.data?.transactions ?? []) as Transaction[]}
              pagination={table?.data?.pagination ?? { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 }}
              isLoading={tableLoading}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-64 animate-pulse rounded-sm border border-rule bg-surface" />
      }
    >
      <ReportsView />
    </Suspense>
  );
}
