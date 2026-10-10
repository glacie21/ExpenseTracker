"use client";

import React, { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ChevronLeft, ChevronRight, PiggyBank, Plus, RefreshCw } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BudgetCard, BudgetView, BUDGET_STATUS } from "@/components/budgets/BudgetCard";
import { BudgetModal, BudgetFormData } from "@/components/budgets/BudgetModal";
import { formatRupiah } from "@/lib/formatters";
import { formatPercent } from "@/lib/finance";
import { todayLocalISO } from "@/lib/dates";
import { Category } from "@/types";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

interface BudgetsData {
  budgets: BudgetView[];
  totals: {
    amount: number;
    spent: number;
    remaining: number;
    percent: number;
    warning: number;
    reached: number;
    over: number;
  };
}

function parseMonthParam(value: string | null): { month: number; year: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) return { month, year };
  }
  const today = todayLocalISO();
  return { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) };
}

function BudgetsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [{ month, year }, setPeriod] = useState(() => parseMonthParam(searchParams.get("month")));
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<{ key: string; data: BudgetsData | null; error: string | null } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [modal, setModal] = useState<BudgetFormData | null>(null);
  const [toDelete, setToDelete] = useState<{ budget: BudgetView | null; isDeleting: boolean }>({
    budget: null,
    isDeleting: false,
  });

  const monthParam = `${year}-${String(month).padStart(2, "0")}`;
  const requestKey = `${monthParam}#${reloadToken}`;

  useEffect(() => {
    window.history.replaceState(null, "", `${pathname}?month=${monthParam}`);
  }, [monthParam, pathname]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/categories?type=EXPENSE", { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCategories(json.data.categories);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/budgets?month=${month}&year=${year}`, { signal: controller.signal })
      .then(async (res) => ({ res, json: await res.json() }))
      .then(({ res, json }) =>
        setResult({
          key: requestKey,
          data: res.ok && json.success ? json.data : null,
          error: res.ok && json.success ? null : json.message || "Gagal memuat anggaran.",
        })
      )
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setResult({ key: requestKey, data: null, error: "Terjadi gangguan jaringan saat memuat anggaran." });
        }
      });
    return () => controller.abort();
  }, [month, year, requestKey]);

  const isLoading = result?.key !== requestKey;
  const data = result?.data ?? null;
  const reload = () => setReloadToken((t) => t + 1);

  const shiftMonth = (delta: number) => {
    const index = year * 12 + (month - 1) + delta;
    setPeriod({ year: Math.floor(index / 12), month: (index % 12) + 1 });
  };

  const handleDelete = async () => {
    if (!toDelete.budget) return;
    setToDelete((prev) => ({ ...prev, isDeleting: true }));
    try {
      const res = await fetch(`/api/budgets/${toDelete.budget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({ type: "success", message: `Anggaran ${toDelete.budget.category.name} berhasil dihapus.` });
        setToDelete({ budget: null, isDeleting: false });
        reload();
        router.refresh();
      } else {
        setFeedback({ type: "error", message: json.message || "Gagal menghapus anggaran." });
        setToDelete((prev) => ({ ...prev, isDeleting: false }));
      }
    } catch {
      setFeedback({ type: "error", message: "Terjadi gangguan jaringan saat menghapus anggaran." });
      setToDelete((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const alerts = data?.budgets.filter((b) => b.status !== "ok") ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">Anggaran Bulanan</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tetapkan batas pengeluaran per kategori dan pantau pemakaiannya.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setModal({ categoryId: "", amount: "", month, year })}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Buat Anggaran
        </Button>
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

      {/* Month selector */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => shiftMonth(-1)} aria-label="Bulan sebelumnya" className="px-2">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <label htmlFor="budget-month-picker" className="sr-only">Bulan anggaran</label>
        <input
          id="budget-month-picker"
          type="month"
          value={monthParam}
          onChange={(e) => e.target.value && setPeriod(parseMonthParam(e.target.value))}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        />
        <Button variant="outline" size="sm" onClick={() => shiftMonth(1)} aria-label="Bulan berikutnya" className="px-2">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="ml-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {MONTHS[month - 1]} {year}
        </span>
      </div>

      {result?.error && !isLoading ? (
        <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center dark:border-rose-900/60 dark:bg-slate-900">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{result.error}</p>
          <Button variant="outline" onClick={reload} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Coba Lagi
          </Button>
        </div>
      ) : !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl border border-slate-200/80 bg-white animate-pulse dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      ) : (
        <div className={`space-y-6 transition-opacity ${isLoading ? "opacity-50" : ""}`} aria-busy={isLoading}>
          {data.budgets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12 dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <PiggyBank className="h-7 w-7" />
              </div>
              <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                Belum ada anggaran untuk {MONTHS[month - 1]} {year}
              </h3>
              <p className="mx-auto mb-6 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Buat anggaran untuk kategori pengeluaran agar Anda mendapat peringatan saat mendekati batas.
              </p>
              <Button onClick={() => setModal({ categoryId: "", amount: "", month, year })} leftIcon={<Plus className="h-4 w-4" />}>
                Buat Anggaran Pertama
              </Button>
            </div>
          ) : (
            <>
              {/* Totals */}
              <section aria-label="Ringkasan anggaran" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Anggaran</p>
                  <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{formatRupiah(data.totals.amount)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Terpakai</p>
                  <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{formatRupiah(data.totals.spent)}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatPercent(data.totals.percent)} dari total anggaran</p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {data.totals.remaining < 0 ? "Melebihi Anggaran" : "Sisa Anggaran"}
                  </p>
                  <p className={`mt-2 text-xl font-bold ${data.totals.remaining < 0 ? "text-rose-700 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
                    {formatRupiah(Math.abs(data.totals.remaining))}
                  </p>
                </div>
              </section>

              {/* Budget alerts */}
              {alerts.length > 0 && (
                <Alert
                  variant={data.totals.over > 0 ? "error" : "warning"}
                  title={`${alerts.length} anggaran perlu perhatian`}
                >
                  <ul className="mt-1 space-y-0.5">
                    {alerts.map((b) => (
                      <li key={b.id}>
                        <span className="font-semibold">{b.category.name}</span>: {BUDGET_STATUS[b.status].label.toLowerCase()} (
                        {formatPercent(b.percent)} terpakai)
                      </li>
                    ))}
                  </ul>
                </Alert>
              )}

              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.budgets.map((budget) => (
                  <BudgetCard
                    key={budget.id}
                    budget={budget}
                    onEdit={(b) => setModal({ id: b.id, categoryId: b.categoryId, amount: b.amount, month: b.month, year: b.year })}
                    onDelete={(b) => setToDelete({ budget: b, isDeleting: false })}
                  />
                ))}
              </section>
            </>
          )}
        </div>
      )}

      {modal && (
        <BudgetModal
          key={modal.id ?? `new-${modal.year}-${modal.month}`}
          initialData={modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSuccess={(message) => {
            setFeedback({ type: "success", message });
            reload();
          }}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(toDelete.budget)}
        onClose={() => setToDelete({ budget: null, isDeleting: false })}
        onConfirm={handleDelete}
        title="Hapus Anggaran?"
        message={`Anggaran ${toDelete.budget?.category.name ?? ""} untuk ${MONTHS[(toDelete.budget?.month ?? 1) - 1]} ${toDelete.budget?.year ?? ""} akan dihapus. Transaksi tidak terpengaruh.`}
        confirmLabel="Ya, Hapus"
        isLoading={toDelete.isDeleting}
        variant="danger"
      />
    </div>
  );
}

export default function BudgetsPage() {
  return (
    <Suspense
      fallback={<div className="h-64 rounded-2xl border border-slate-200/80 bg-white animate-pulse dark:border-slate-800 dark:bg-slate-900" />}
    >
      <BudgetsView />
    </Suspense>
  );
}
