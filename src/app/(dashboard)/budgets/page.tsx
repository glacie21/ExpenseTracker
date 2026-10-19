"use client";

import React, { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BudgetLedger, BudgetView, BUDGET_STATUS } from "@/components/budgets/BudgetLedger";
import { BudgetModal, BudgetFormData } from "@/components/budgets/BudgetModal";
import { formatPercent } from "@/lib/finance";
import { MONTH_NAMES, todayLocalISO } from "@/lib/dates";
import { useExternalNavigationKey } from "@/lib/useExternalNavigationKey";
import { EmptyBlock, ErrorState } from "@/components/ui/States";
import { Category } from "@/types";

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

function BudgetsView({ writeQuery }: { writeQuery: (pathname: string, query: string) => void }) {
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
    writeQuery(pathname, `month=${monthParam}`);
  }, [monthParam, pathname, writeQuery]);

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

  const periodLabel = `${MONTH_NAMES[month - 1]} ${year}`;
  const openCreate = () => setModal({ categoryId: "", amount: "", month, year });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-rule pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => shiftMonth(-1)} aria-label="Bulan sebelumnya" className="px-1.5">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="min-w-40 text-center font-display text-2xl font-semibold text-ink" aria-live="polite">
            {periodLabel}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => shiftMonth(1)} aria-label="Bulan berikutnya" className="px-1.5">
            <ChevronRight className="h-5 w-5" />
          </Button>
          <label htmlFor="budget-month-picker" className="sr-only">
            Pilih bulan anggaran
          </label>
          <input
            id="budget-month-picker"
            type="month"
            value={monthParam}
            onChange={(e) => e.target.value && setPeriod(parseMonthParam(e.target.value))}
            className="ml-2 hidden h-8 rounded-lg border sm:block border-rule bg-surface px-2 text-xs text-ink-2 hover:border-ink-3 focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none"
          />
        </div>
        <Button variant="primary" onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
          Buat anggaran
        </Button>
      </div>

      {feedback && (
        <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {result?.error && !isLoading ? (
        <ErrorState title="Anggaran gagal dimuat" message={result.error} onRetry={reload} />
      ) : !data ? (
        <div className="h-64 animate-pulse rounded-2xl border border-rule bg-surface" aria-busy="true" />
      ) : (
        <div className={`space-y-6 transition-opacity ${isLoading ? "opacity-50" : ""}`} aria-busy={isLoading}>
          {data.budgets.length === 0 ? (
            <EmptyBlock title={`Belum ada anggaran untuk ${periodLabel}`} action={<Button onClick={openCreate}>Buat anggaran</Button>}>
              Tetapkan batas bulanan untuk kategori pengeluaran. Anda akan diberi tahu di sini saat pemakaiannya
              mendekati batas.
            </EmptyBlock>
          ) : (
            <>
              {alerts.length > 0 && (
                <Alert
                  variant={data.totals.over > 0 ? "error" : "warning"}
                  title={`${alerts.length} anggaran perlu diperhatikan`}
                >
                  <ul className="mt-1 space-y-0.5">
                    {alerts.map((b) => (
                      <li key={b.id}>
                        <span className="font-medium text-ink">{b.category.name}</span>:{" "}
                        {BUDGET_STATUS[b.status].label.toLowerCase()}, {formatPercent(b.percent)} terpakai
                      </li>
                    ))}
                  </ul>
                </Alert>
              )}

              <BudgetLedger
                budgets={data.budgets}
                totals={data.totals}
                periodLabel={periodLabel}
                onEdit={(b) => setModal({ id: b.id, categoryId: b.categoryId, amount: b.amount, month: b.month, year: b.year })}
                onDelete={(b) => setToDelete({ budget: b, isDeleting: false })}
              />

              <p className="text-xs text-ink-3">
                Terpakai dihitung dari pengeluaran pada kategori yang sama di bulan ini. Peringatan muncul
                mulai 80% dari batas.
              </p>
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
        title="Hapus anggaran?"
        message={`Anggaran ${toDelete.budget?.category.name ?? ""} untuk ${MONTH_NAMES[(toDelete.budget?.month ?? 1) - 1]} ${toDelete.budget?.year ?? ""} akan dihapus. Transaksi tidak terpengaruh.`}
        confirmLabel="Hapus"
        isLoading={toDelete.isDeleting}
        variant="danger"
      />
    </div>
  );
}

// A sidebar link or Back/Forward remounts the view so it re-reads the month from the URL
function BudgetsRoute() {
  const [navigationKey, writeQuery] = useExternalNavigationKey();
  return <BudgetsView key={navigationKey} writeQuery={writeQuery} />;
}

export default function BudgetsPage() {
  return (
    <Suspense
      fallback={<div className="h-64 animate-pulse rounded-2xl border border-rule bg-surface" />}
    >
      <BudgetsRoute />
    </Suspense>
  );
}
