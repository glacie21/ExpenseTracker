/**
 * Unit tests for pure financial calculations (src/lib/finance.ts).
 * Runs without the app or database: node --test tests/unit/
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  budgetUsage,
  centsToAmount,
  netBalanceCents,
  periodChange,
  savingsRate,
  shareOfTotal,
} from "../../src/lib/finance.ts";

describe("totals and net balance", () => {
  test("net balance is income minus expense, exactly in cents", () => {
    // 0.10 + 0.20 style values stay exact because they are integer cents
    const income = 10 + 20; // Rp0,10 + Rp0,20
    assert.equal(netBalanceCents(income, 30), 0);
    assert.equal(netBalanceCents(500000000, 2500050), 497499950);
    assert.equal(centsToAmount(497499950), 4974999.5);
  });

  test("empty periods are zero", () => {
    assert.equal(netBalanceCents(0, 0), 0);
    assert.equal(savingsRate(0, 0), 0);
  });

  test("net balance can be negative", () => {
    assert.equal(netBalanceCents(100, 250), -150);
  });
});

describe("savings rate", () => {
  test("is (income - expense) / income × 100", () => {
    assert.equal(savingsRate(10_000_00, 7_500_00), 25);
    assert.equal(savingsRate(10_000_00, 0), 100);
  });

  test("is 0% when income is zero (no division by zero)", () => {
    assert.equal(savingsRate(0, 50_000_00), 0);
  });

  test("is negative when expenses exceed income", () => {
    assert.equal(savingsRate(100_00, 150_00), -50);
  });
});

describe("period change", () => {
  test("reports difference and percentage vs the previous period", () => {
    assert.deepEqual(periodChange(150_00, 100_00), {
      current: 150_00,
      previous: 100_00,
      difference: 50_00,
      percent: 50,
    });
    assert.equal(periodChange(50_00, 100_00).percent, -50);
  });

  test("has no percentage when the previous period is zero", () => {
    const change = periodChange(100_00, 0);
    assert.equal(change.difference, 100_00);
    assert.equal(change.percent, null);
    assert.equal(periodChange(0, 0).percent, null);
  });

  test("uses |previous| so a negative base does not flip the sign", () => {
    // Net balance improved from -100 to +100: that is +200%, not -200%
    assert.equal(periodChange(100_00, -100_00).percent, 200);
  });
});

describe("share of total", () => {
  test("percentages of a total", () => {
    assert.equal(shareOfTotal(25, 100), 25);
    assert.equal(shareOfTotal(0, 100), 0);
    assert.equal(shareOfTotal(10, 0), 0);
  });
});

describe("budget usage", () => {
  test("remaining and percentage of an unused budget", () => {
    assert.deepEqual(budgetUsage(1_000_000_00, 0), {
      budget: 1_000_000_00,
      spent: 0,
      remaining: 1_000_000_00,
      percent: 0,
      status: "ok",
    });
  });

  test("warning from 80%", () => {
    assert.equal(budgetUsage(100_00, 79_99).status, "ok");
    assert.equal(budgetUsage(100_00, 80_00).status, "warning");
    assert.equal(budgetUsage(100_00, 99_99).status, "warning");
  });

  test("reached at exactly 100%", () => {
    const usage = budgetUsage(100_00, 100_00);
    assert.equal(usage.status, "reached");
    assert.equal(usage.remaining, 0);
    assert.equal(usage.percent, 100);
  });

  test("over budget above 100% with negative remaining", () => {
    const usage = budgetUsage(100_00, 125_50);
    assert.equal(usage.status, "over");
    assert.equal(usage.remaining, -25_50);
    assert.equal(usage.percent, 125.5);
  });
});
