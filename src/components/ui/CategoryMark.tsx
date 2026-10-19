import React from "react";

/**
 * A rounded tile with the category's initial on a tint of its color, as in a
 * wallet app's history list. The name is always printed next to it, so the
 * tile is decorative.
 */
export function CategoryMark({ name, color }: { name?: string | null; color?: string | null }) {
  const tint = color ?? "var(--ink-3)";
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-base font-semibold text-ink"
      style={{ backgroundColor: `color-mix(in srgb, ${tint} 22%, var(--surface))` }}
    >
      {(name?.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}
