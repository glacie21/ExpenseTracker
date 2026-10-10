"use client";

import React, { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarRange, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PERIOD_PRESETS, PeriodPreset } from "@/lib/dates";

interface PeriodFilterProps {
  preset: PeriodPreset;
  start: string;
  end: string;
  label: string;
  children: React.ReactNode;
}

/**
 * Date-range filter for the dashboard. It sits above everything it scopes;
 * while the new period loads, the current content stays in place (dimmed).
 */
export function PeriodFilter({ preset, start, end, label, children }: PeriodFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [showCustom, setShowCustom] = useState(preset === "custom");
  const [customStart, setCustomStart] = useState(start);
  const [customEnd, setCustomEnd] = useState(end);
  const [error, setError] = useState<string | null>(null);

  const navigate = (params: Record<string, string>) => {
    startTransition(() => {
      router.push(`${pathname}?${new URLSearchParams(params).toString()}`, { scroll: false });
    });
  };

  const selectPreset = (value: PeriodPreset) => {
    setError(null);
    if (value === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    navigate({ period: value });
  };

  const applyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) {
      setError("Isi tanggal awal dan akhir.");
      return;
    }
    if (customStart > customEnd) {
      setError("Tanggal awal tidak boleh setelah tanggal akhir.");
      return;
    }
    setError(null);
    navigate({ period: "custom", start: customStart, end: customEnd });
  };

  const activeValue = showCustom ? "custom" : preset;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Pilih periode">
          {PERIOD_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => selectPreset(p.value)}
              aria-pressed={activeValue === p.value}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
                activeValue === p.value
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800"
              }`}
            >
              {p.label}
            </button>
          ))}
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-label="Memuat periode" />
          )}
        </div>

        {showCustom && (
          <form onSubmit={applyCustom} className="flex flex-wrap items-end gap-3">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Dari
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                required
              />
            </label>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Sampai
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                required
              />
            </label>
            <Button type="submit" size="sm" variant="secondary">
              Terapkan
            </Button>
            {error && <p className="w-full text-xs text-rose-600">{error}</p>}
          </form>
        )}

        <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <CalendarRange className="h-3.5 w-3.5" />
          Periode: <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        </p>
      </div>

      <div className={`transition-opacity ${isPending ? "opacity-50" : ""}`} aria-busy={isPending}>
        {children}
      </div>
    </div>
  );
}
