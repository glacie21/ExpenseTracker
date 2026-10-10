/**
 * Series colors for income vs expense charts.
 *
 * Validated with the dataviz palette checker against light and dark
 * surfaces: teal/rose keeps CVD separation (ΔE ≥ 10 for protan/deutan),
 * which the app's emerald/rose text colors do not (ΔE 5.6). Identity is
 * also carried by legend labels, fixed bar order and the table view.
 */
export const INCOME_COLOR = "#0d9488";
export const EXPENSE_COLOR = "#f43f5e";

/** Fallback when a category has no color of its own. */
export const NEUTRAL_CATEGORY_COLOR = "#64748b";

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
