"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
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
import { formatRupiah, formatRupiahSigned } from "@/lib/formatters";
import { downloadFile } from "@/lib/download";
import { Category, PaginatedTransactions, Transaction, TransactionType } from "@/types";

type PeriodType = "week" | "month" | "year" | "custom";

const PERIOD_TABS: { value: PeriodType; label: string }[] = [
  { value: "week", label: "Mingguan" },
  { value: "month", label: "Bulanan" },
  { value: "year", label: "Tahunan" },
  { value: "custom", label: "Rentang Khusus" },
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

function SummaryTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 break-words text-xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
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
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200";
  const labelClass = "block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 dark:text-slate-400";
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Laporan Keuangan
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Ringkasan mingguan, bulanan, tahunan, atau rentang khusus dari transaksi Anda.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("csv")}
            isLoading={exporting === "csv"}
            disabled={!reportQuery || exporting !== null}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleExport("pdf")}
            isLoading={exporting === "pdf"}
            disabled={!reportQuery || exporting !== null}
            leftIcon={<FileText className="h-4 w-4" />}
          >
            Download PDF
          </Button>
        </div>
      </div>

      {feedback && (
        <Alert
          variant={feedback.type}
          onClose={() => setFeedback(null)}
          title={feedback.type === "success" ? "Berhasil" : "Perhatian"}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Filters */}
      <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Jenis periode laporan">
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
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
                periodType === tab.value
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {periodType === "custom" ? (
            <>
              <div>
                <label htmlFor="report-start" className={labelClass}>Dari Tanggal</label>
                <input
                  id="report-start"
                  type="date"
                  value={customStart}
                  onChange={(e) => changeFilter(setCustomStart)(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="report-end" className={labelClass}>Sampai Tanggal</label>
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
                {periodType === "week" ? "Minggu (pilih salah satu tanggal)" : periodType === "month" ? "Bulan" : "Tahun"}
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Periode sebelumnya"
                  onClick={() => changeFilter(setAnchor)(shiftAnchor(periodType, anchor, -1))}
                  className="h-[34px] px-2"
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
                  variant="outline"
                  size="sm"
                  aria-label="Periode berikutnya"
                  onClick={() => changeFilter(setAnchor)(shiftAnchor(periodType, anchor, 1))}
                  className="h-[34px] px-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="report-type" className={labelClass}>Jenis Transaksi</label>
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
              <option value="">Semua Kategori</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === "INCOME" ? "Pemasukan" : "Pengeluaran"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {!range && (
          <p className="text-xs text-rose-600">
            Pilih rentang tanggal yang valid (tanggal awal tidak setelah tanggal akhir, maksimal 5 tahun).
          </p>
        )}
        {report && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Periode: <span className="font-semibold text-slate-700 dark:text-slate-200">{report.period.label}</span>
            {" · "}dibandingkan dengan {report.period.previousLabel}
          </p>
        )}
      </div>

      {summary?.error && !summaryLoading ? (
        <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center dark:border-rose-900/60 dark:bg-slate-900">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{summary.error}</p>
          <Button variant="outline" onClick={() => setReloadToken((t) => t + 1)} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Coba Lagi
          </Button>
        </div>
      ) : !report ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3" aria-busy="true">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 rounded-2xl border border-slate-200/80 bg-white animate-pulse dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      ) : (
        <div className={`space-y-6 transition-opacity ${summaryLoading ? "opacity-50" : ""}`} aria-busy={summaryLoading}>
          {/* Report Summary */}
          <section aria-label="Ringkasan laporan" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryTile label="Total Income" value={formatRupiah(report.summary.totalIncome)} hint={`${report.summary.incomeCount} transaksi`} />
            <SummaryTile label="Total Expense" value={formatRupiah(report.summary.totalExpense)} hint={`${report.summary.expenseCount} transaksi`} />
            <SummaryTile label="Net Balance" value={formatRupiah(report.summary.netBalance)} />
            <SummaryTile
              label="Savings Rate"
              value={formatPercent(report.summary.savingsRate)}
              hint={report.summary.totalIncome > 0 ? undefined : "0% karena tidak ada pemasukan"}
            />
            <SummaryTile label="Jumlah Transaksi" value={String(report.summary.transactionCount)} />
            <SummaryTile
              label="Kategori Pengeluaran Terbesar"
              value={report.topExpenseCategory?.name ?? "-"}
              hint={
                report.topExpenseCategory
                  ? `${formatRupiah(report.topExpenseCategory.total)} · ${formatPercent(report.topExpenseCategory.percent)}`
                  : "Belum ada pengeluaran"
              }
            />
          </section>

          {/* Category Insights */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribusi Pengeluaran</CardTitle>
                <CardDescription>Pengeluaran per kategori pada periode ini.</CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseBreakdown items={report.breakdown} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kenaikan Pengeluaran</CardTitle>
                <CardDescription>Kategori yang pengeluarannya naik dibanding {report.period.previousLabel}.</CardDescription>
              </CardHeader>
              <CardContent>
                {report.categoryIncreases.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    Tidak ada kategori dengan kenaikan pengeluaran pada periode ini.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {report.categoryIncreases.map((c) => (
                      <li key={c.categoryId} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <span className="inline-flex min-w-0 items-center gap-2 text-slate-700 dark:text-slate-200">
                          <TrendingUp className="h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
                          <span className="truncate">{c.name}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{formatRupiahSigned(c.difference)}</span>
                          <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                            {c.percent === null ? "baru periode ini" : `+${formatPercent(c.percent)}`}
                          </span>
                          <span className="block text-xs text-slate-400">
                            {formatRupiah(c.previous)} → {formatRupiah(c.current)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      )}

      {/* Transaction Summary */}
      {range && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Transaksi</CardTitle>
            <CardDescription>Transaksi sesuai periode dan filter laporan.</CardDescription>
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
        <div className="h-64 rounded-2xl border border-slate-200/80 bg-white animate-pulse dark:border-slate-800 dark:bg-slate-900" />
      }
    >
      <ReportsView />
    </Suspense>
  );
}
