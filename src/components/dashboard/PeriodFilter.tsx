"use client";

import React, { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PERIOD_PRESETS, PeriodPreset } from "@/lib/dates";
import { tabClass } from "@/components/ui/fieldStyles";

interface PeriodFilterProps {
  preset: PeriodPreset;
  start: string;
  end: string;
  label: string;
  /** Rendered at the right end of the period row (e.g. quick actions). */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const DATE_INPUT =
  "mt-1 block h-9 rounded-lg border border-rule bg-surface px-2.5 text-sm text-ink focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none";

/**
 * Date-range filter for the dashboard. It sits above everything it scopes;
 * while the new period loads, the current content stays in place (dimmed).
 */
export function PeriodFilter({ preset, start, end, label, actions, children }: PeriodFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [showCustom, setShowCustom] = useState(preset === "custom");
  const [customStart, setCustomStart] = useState(start);
  const [customEnd, setCustomEnd] = useState(end);
  const [error, setError] = useState<string | null>(null);

  // The component stays mounted across navigations; when the URL's period
  // changes underneath it (Back/Forward), reset the form to match
  const periodKey = `${preset}|${start}|${end}`;
  const [syncedKey, setSyncedKey] = useState(periodKey);
  if (periodKey !== syncedKey) {
    setSyncedKey(periodKey);
    setShowCustom(preset === "custom");
    setCustomStart(start);
    setCustomEnd(end);
    setError(null);
  }

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
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div
            className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-sunken p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Pilih periode"
          >
            {PERIOD_PRESETS.map((p) => {
              const active = activeValue === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => selectPreset(p.value)}
                  aria-pressed={active}
                  className={tabClass(active)}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </div>

        {showCustom && (
          <form onSubmit={applyCustom} className="flex flex-wrap items-end gap-3">
            <label className="text-xs text-ink-3">
              Dari
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className={DATE_INPUT}
                required
              />
            </label>
            <label className="text-xs text-ink-3">
              Sampai
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className={DATE_INPUT}
                required
              />
            </label>
            <Button type="submit" size="md" variant="primary">
              Terapkan
            </Button>
            {error && <p className="w-full text-xs text-neg">{error}</p>}
          </form>
        )}

        <p className="flex items-center gap-2 text-sm text-ink-2">
          <span className="font-display text-xl font-semibold text-ink">{label}</span>
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-ink-3" aria-label="Memuat periode" />}
        </p>
      </div>

      <div className={`transition-opacity ${isPending ? "opacity-50" : ""}`} aria-busy={isPending}>
        {children}
      </div>
    </div>
  );
}
