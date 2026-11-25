import { PERIOD_PRESETS } from "@/lib/dates";
import { tabClass } from "@/components/ui/fieldStyles";

/**
 * Same layout as PeriodFilter and the dashboard grid, so nothing shifts when
 * the page arrives: the period pills are the real ones with hidden labels.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat dashboard">
      <div className="space-y-4">
        <div className="flex w-fit max-w-full animate-pulse gap-1 overflow-hidden rounded-xl bg-sunken p-1" aria-hidden="true">
          {PERIOD_PRESETS.map((p) => (
            <span key={p.value} className={tabClass(false)}>
              <span className="invisible">{p.label}</span>
            </span>
          ))}
        </div>
        <div className="h-7 w-56 animate-pulse rounded-lg bg-sunken" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="h-80 animate-pulse rounded-2xl border border-rule bg-surface lg:col-span-2" />
        <div className="h-80 animate-pulse rounded-2xl border border-rule bg-surface lg:col-span-3" />
      </div>
    </div>
  );
}
