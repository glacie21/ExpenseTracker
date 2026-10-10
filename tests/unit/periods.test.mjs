/**
 * Unit tests for period/date helpers (src/lib/dates.ts).
 * Runs without the app or database: node --test tests/unit/
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  bucketStarts,
  chooseGranularity,
  parseDateOnly,
  previousPeriod,
  resolvePeriod,
  todayInTimeZone,
  toDateOnlyString,
  validateCustomRange,
} from "../../src/lib/dates.ts";

const d = (s) => parseDateOnly(s);
const fmt = (range) => range && [toDateOnlyString(range.start), toDateOnlyString(range.end)];

// Saturday 10 October 2026
const TODAY = d("2026-10-10");

describe("resolvePeriod", () => {
  test("presets resolve to whole calendar periods", () => {
    assert.deepEqual(fmt(resolvePeriod("this_week", TODAY)), ["2026-10-05", "2026-10-11"]);
    assert.deepEqual(fmt(resolvePeriod("this_month", TODAY)), ["2026-10-01", "2026-10-31"]);
    assert.deepEqual(fmt(resolvePeriod("last_month", TODAY)), ["2026-09-01", "2026-09-30"]);
    assert.deepEqual(fmt(resolvePeriod("last_3_months", TODAY)), ["2026-08-01", "2026-10-31"]);
    assert.deepEqual(fmt(resolvePeriod("this_year", TODAY)), ["2026-01-01", "2026-12-31"]);
  });

  test("weeks start on Monday, also when today is Sunday", () => {
    assert.deepEqual(fmt(resolvePeriod("this_week", d("2026-10-11"))), ["2026-10-05", "2026-10-11"]);
    assert.deepEqual(fmt(resolvePeriod("this_week", d("2026-10-12"))), ["2026-10-12", "2026-10-18"]);
  });

  test("last month across a year boundary and leap February", () => {
    assert.deepEqual(fmt(resolvePeriod("last_month", d("2026-01-15"))), ["2025-12-01", "2025-12-31"]);
    assert.deepEqual(fmt(resolvePeriod("last_month", d("2028-03-01"))), ["2028-02-01", "2028-02-29"]);
  });

  test("custom ranges are validated", () => {
    const custom = (a, b) => resolvePeriod("custom", TODAY, { start: d(a), end: d(b) });
    assert.deepEqual(fmt(custom("2026-10-01", "2026-10-05")), ["2026-10-01", "2026-10-05"]);
    assert.equal(custom("2026-10-05", "2026-10-01"), null, "start after end");
    assert.equal(resolvePeriod("custom", TODAY, { start: null, end: d("2026-10-01") }), null);
    assert.equal(validateCustomRange(d("2015-01-01"), d("2026-01-01")), null, "longer than 5 years");
  });
});

describe("previousPeriod", () => {
  test("is the same calendar unit before", () => {
    const prev = (preset) => fmt(previousPeriod(preset, resolvePeriod(preset, TODAY)));
    assert.deepEqual(prev("this_week"), ["2026-09-28", "2026-10-04"]);
    assert.deepEqual(prev("this_month"), ["2026-09-01", "2026-09-30"]);
    assert.deepEqual(prev("last_month"), ["2026-08-01", "2026-08-31"]);
    assert.deepEqual(prev("last_3_months"), ["2026-05-01", "2026-07-31"]);
    assert.deepEqual(prev("this_year"), ["2025-01-01", "2025-12-31"]);
  });

  test("custom: same number of days immediately before", () => {
    const range = { start: d("2026-10-01"), end: d("2026-10-10") };
    assert.deepEqual(fmt(previousPeriod("custom", range)), ["2026-09-21", "2026-09-30"]);
  });
});

describe("chart buckets", () => {
  test("granularity follows the range length", () => {
    assert.equal(chooseGranularity(resolvePeriod("this_month", TODAY)), "day");
    assert.equal(chooseGranularity(resolvePeriod("last_3_months", TODAY)), "week");
    assert.equal(chooseGranularity(resolvePeriod("this_year", TODAY)), "month");
  });

  test("every bucket in the range is present, including empty ones", () => {
    const days = bucketStarts(resolvePeriod("this_week", TODAY), "day");
    assert.equal(days.length, 7);
    const months = bucketStarts(resolvePeriod("this_year", TODAY), "month").map(toDateOnlyString);
    assert.equal(months.length, 12);
    assert.equal(months[11], "2026-12-01");
    // Weekly buckets start on the Monday on/before the range start
    const weeks = bucketStarts({ start: d("2026-10-01"), end: d("2026-10-14") }, "week");
    assert.deepEqual(weeks.map(toDateOnlyString), ["2026-09-28", "2026-10-05", "2026-10-12"]);
  });
});

describe("timezone", () => {
  test("today follows the configured timezone, not UTC", () => {
    // 20:00 UTC on 9 Oct is already 10 Oct in Jakarta (UTC+7)
    const now = new Date("2026-10-09T20:00:00Z");
    assert.equal(toDateOnlyString(todayInTimeZone("Asia/Jakarta", now)), "2026-10-10");
    assert.equal(toDateOnlyString(todayInTimeZone("UTC", now)), "2026-10-09");
  });

  test("impossible dates are rejected", () => {
    assert.equal(parseDateOnly("2026-02-30"), null);
    assert.equal(parseDateOnly("2028-02-29")?.toISOString(), "2028-02-29T00:00:00.000Z");
  });
});
