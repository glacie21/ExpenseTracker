/** Shared classes for native selects, date inputs and textareas, matching `Input`. */
export const FIELD =
  "h-10 w-full rounded-lg border border-rule bg-surface px-3 text-sm text-ink transition-colors hover:border-ink-3 focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50";

/** A compact field for filter rows. */
export const FIELD_SM =
  "h-9 w-full rounded-lg border border-rule bg-surface px-2.5 text-sm text-ink transition-colors hover:border-ink-3 focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50";

export const FIELD_LABEL = "mb-1.5 block text-sm font-medium text-ink-2";

/** Small label above a filter field. */
export const FILTER_LABEL = "mb-1 block text-xs text-ink-3";

/** One option of a segmented control (the sunken pill row of period and type pickers). */
export function tabClass(active: boolean) {
  return `shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors ${
    active
      ? "bg-surface font-medium text-ink shadow-[0_1px_2px_rgb(19_36_31/0.12)]"
      : "text-ink-2 hover:text-ink"
  }`;
}
