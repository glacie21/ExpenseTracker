import React from "react";
import { NEUTRAL_CATEGORY_COLOR } from "@/components/charts/chartTheme";

/** The small coloured dot beside a category name; decorative, the name is always printed. */
export function CategoryDot({ color, size = "sm" }: { color?: string | null; size?: "sm" | "md" }) {
  return (
    <span
      className={`shrink-0 rounded-full ${size === "md" ? "h-2.5 w-2.5" : "h-2 w-2"}`}
      style={{ backgroundColor: color || NEUTRAL_CATEGORY_COLOR }}
      aria-hidden="true"
    />
  );
}
