/** Shared classes for native selects, date inputs and textareas, matching `Input`. */
export const FIELD =
  "h-10 w-full rounded-sm border border-rule bg-surface px-3 text-sm text-ink transition-colors hover:border-ink-3 focus:border-ink focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

/** A compact field for filter rows. */
export const FIELD_SM =
  "h-9 w-full rounded-sm border border-rule bg-surface px-2.5 text-sm text-ink transition-colors hover:border-ink-3 focus:border-ink focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

export const FIELD_LABEL = "mb-1.5 block text-sm font-medium text-ink-2";

/** Small label above a filter field. */
export const FILTER_LABEL = "mb-1 block text-xs text-ink-3";

/** Underlined tab, as used by the dashboard period picker. */
export function tabClass(active: boolean) {
  return `shrink-0 border-b-2 pb-2.5 text-sm transition-colors ${
    active ? "border-ink font-medium text-ink" : "border-transparent text-ink-3 hover:text-ink"
  }`;
}
