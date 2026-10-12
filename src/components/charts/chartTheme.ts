/**
 * Series colors for income vs expense charts, as CSS variables so light and
 * dark mode each use their own validated step (see globals.css).
 *
 * Validated with the dataviz palette checker against the light and dark
 * surfaces: blue ink / red ink keeps CVD separation (ΔE ≥ 14 protan) and
 * passes the chroma and lightness bands in both modes. Identity is
 * also carried by legend labels, fixed bar order and the table view.
 */
export const INCOME_COLOR = "var(--chart-income)";
export const EXPENSE_COLOR = "var(--chart-expense)";

/** Fallback when a category has no color of its own. */
export const NEUTRAL_CATEGORY_COLOR = "var(--ink-3)";

/** Path for a bar with 4px rounded top corners, anchored to the baseline. */
export function roundedTopBar(x: number, y: number, width: number, height: number, radius = 4): string {
  const r = Math.min(radius, width / 2, height);
  return [
    `M${x},${y + height}`,
    `V${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `H${x + width - r}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `V${y + height}`,
    "Z",
  ].join(" ");
}

/** "Nice" axis maximum and tick values starting at 0. */
export function niceTicks(maxValue: number, tickCount = 4): number[] {
  if (maxValue <= 0) return [0];
  const rawStep = maxValue / tickCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  const niceStep = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10) * magnitude;
  const ticks: number[] = [];
  for (let v = 0; v <= maxValue + niceStep * 0.001; v += niceStep) ticks.push(v);
  if (ticks[ticks.length - 1] < maxValue) ticks.push(ticks[ticks.length - 1] + niceStep);
  return ticks;
}
