import type { TransactionType } from "@/types";

/**
 * Category colours. No server imports, so the category form can use the same
 * palette as the API, the CSV import and the default categories.
 */

// Muted inks that stay readable as small dots on both the light and dark paper
export const CATEGORY_PALETTE = [
  { value: "#2b67a8", name: "Biru" },
  { value: "#5f8fb8", name: "Biru muda" },
  { value: "#3d8a8a", name: "Hijau laut" },
  { value: "#4f7d3a", name: "Hijau" },
  { value: "#8a9a2b", name: "Zaitun" },
  { value: "#b8892b", name: "Kuning tanah" },
  { value: "#c4532b", name: "Jingga" },
  { value: "#a8324a", name: "Merah tua" },
  { value: "#8a4f9e", name: "Ungu" },
  { value: "#5b5fa8", name: "Nila" },
  { value: "#7a6a55", name: "Cokelat" },
  { value: "#75716a", name: "Abu-abu" },
];

/** Colour for a category created without one (API, CSV import); one of the palette's swatches. */
export const DEFAULT_CATEGORY_COLOR = "#75716a";

/** Pre-selected swatch in the form for a new category of each type. */
export const DEFAULT_COLOR_BY_TYPE: Record<TransactionType, string> = { INCOME: "#2b67a8", EXPENSE: "#c4532b" };
