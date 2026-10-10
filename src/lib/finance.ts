/**
 * Pure financial calculations shared by dashboard, reports and budgets.
 *
 * Money is handled in integer cents (sen) so additions and subtractions are
 * exact; convert Prisma Decimals with `decimalToCents` from lib/money.ts.
 * This module has no imports so it can be unit-tested directly with Node.
 */

export function centsToAmount(cents: number): number {
  return cents / 100;
}

export function netBalanceCents(incomeCents: number, expenseCents: number): number {
  return incomeCents - expenseCents;
}

/**
 * (income - expense) / income × 100. Returns 0 when there is no income, to
 * avoid dividing by zero. Negative when expenses exceed income.
 */
export function savingsRate(incomeCents: number, expenseCents: number): number {
  if (incomeCents <= 0) return 0;
  return ((incomeCents - expenseCents) * 100) / incomeCents;
}

export interface PeriodChange {
  current: number;
  previous: number;
  difference: number;
  /** Percentage change vs |previous|; null when there is nothing to compare against. */
  percent: number | null;
}

export function periodChange(currentCents: number, previousCents: number): PeriodChange {
  const difference = currentCents - previousCents;
  return {
    current: currentCents,
    previous: previousCents,
    difference,
    percent: previousCents === 0 ? null : (difference * 100) / Math.abs(previousCents),
  };
}

/** Share of `partCents` in `totalCents` as a percentage (0 when total is 0). */
export function shareOfTotal(partCents: number, totalCents: number): number {
  if (totalCents <= 0) return 0;
  return (partCents * 100) / totalCents;
}

export const BUDGET_WARNING_PERCENT = 80;

export type BudgetStatus = "ok" | "warning" | "reached" | "over";

export interface BudgetUsage {
  budget: number;
  spent: number;
  /** Negative when over budget. */
  remaining: number;
  /** spent / budget × 100; may exceed 100. */
  percent: number;
  status: BudgetStatus;
}

/**
 * Budget usage in cents. Status: "warning" from 80%, "reached" at exactly
 * 100%, "over" above 100%.
 */
export function budgetUsage(budgetCents: number, spentCents: number): BudgetUsage {
  const percent = budgetCents > 0 ? (spentCents * 100) / budgetCents : 0;
  let status: BudgetStatus = "ok";
  if (spentCents > budgetCents) status = "over";
  else if (budgetCents > 0 && spentCents === budgetCents) status = "reached";
  else if (percent >= BUDGET_WARNING_PERCENT) status = "warning";

  return {
    budget: budgetCents,
    spent: spentCents,
    remaining: budgetCents - spentCents,
    percent,
    status,
  };
}

/** Format a percentage for display, e.g. 12.345 -> "12,3%". */
export function formatPercent(value: number, fractionDigits = 1): string {
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(value);
  return `${formatted}%`;
}
