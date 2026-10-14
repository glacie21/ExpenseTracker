/**
 * Unit tests for period/date helpers (src/lib/dates.ts).
 * Runs without the app or database: node --test tests/unit/
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  bucketStarts,
  chooseGranularity,
  comparisonRanges,
  formatComparisonLabel,
  isWholePeriod,
  latestTransactionDate,
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

describe("comparisonRanges", () => {
  // Wednesday 14 October 2026
  const MID = d("2026-10-14");
  const compare = (preset, today = MID) => {
    const c = comparisonRanges(preset, resolvePeriod(preset, today), today);
    return { current: fmt(c.current), previous: fmt(c.previous), partial: c.partial };
  };

  test("a running period is compared up to today on both sides", () => {
    assert.deepEqual(compare("this_week"), {
      current: ["2026-10-12", "2026-10-14"],
      previous: ["2026-10-05", "2026-10-07"],
      partial: true,
    });
    assert.deepEqual(compare("this_month"), {
      current: ["2026-10-01", "2026-10-14"],
      previous: ["2026-09-01", "2026-09-14"],
      partial: true,
    });
    assert.deepEqual(compare("last_3_months"), {
      current: ["2026-08-01", "2026-10-14"],
      previous: ["2026-05-01", "2026-07-14"],
      partial: true,
    });
    assert.deepEqual(compare("this_year"), {
      current: ["2026-01-01", "2026-10-14"],
      previous: ["2025-01-01", "2025-10-14"],
      partial: true,
    });
  });

  test("the same date is clamped to the end of a shorter previous month", () => {
    assert.deepEqual(compare("this_month", d("2026-03-30")).previous, ["2026-02-01", "2026-02-28"]);
  });

  test("a finished period, or one on its last day, is compared whole", () => {
    assert.deepEqual(compare("last_month"), {
      current: ["2026-09-01", "2026-09-30"],
      previous: ["2026-08-01", "2026-08-31"],
      partial: false,
    });
    assert.equal(compare("this_month", d("2026-10-31")).partial, false);
  });

  test("a custom range that includes today is cut at today", () => {
    const range = { start: d("2026-10-01"), end: d("2026-10-31") };
    const c = comparisonRanges("custom", range, MID);
    assert.deepEqual(fmt(c.current), ["2026-10-01", "2026-10-14"]);
    assert.deepEqual(fmt(c.previous), ["2026-08-31", "2026-09-13"]);
  });

  test("the label says when the comparison was cut", () => {
    const c = comparisonRanges("this_month", resolvePeriod("this_month", MID), MID);
    assert.equal(formatComparisonLabel(c), "1 Sep 2026 – 14 Sep 2026 (sampai tanggal yang sama)");
  });
});

describe("isWholePeriod", () => {
  const range = (a, b) => ({ start: d(a), end: d(b) });

  test("weeks, months and years must cover exactly that unit", () => {
    assert.equal(isWholePeriod("this_week", range("2026-10-12", "2026-10-18")), true);
    assert.equal(isWholePeriod("this_week", range("2026-10-01", "2026-10-30")), false);
    assert.equal(isWholePeriod("this_month", range("2028-02-01", "2028-02-29")), true);
    assert.equal(isWholePeriod("this_month", range("2026-10-01", "2026-12-31")), false);
    assert.equal(isWholePeriod("this_year", range("2026-01-01", "2026-12-31")), true);
    assert.equal(isWholePeriod("this_year", range("2026-01-01", "2026-06-30")), false);
  });

  test("custom accepts any range", () => {
    assert.equal(isWholePeriod("custom", range("2026-10-03", "2026-11-17")), true);
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

describe("parseDateOnly", () => {
  test("accepts a calendar day, or the API's UTC-midnight timestamp", () => {
    assert.equal(toDateOnlyString(d("2026-10-14")), "2026-10-14");
    assert.equal(toDateOnlyString(d(" 2026-10-14 ")), "2026-10-14");
    assert.equal(toDateOnlyString(d("2026-10-14T00:00:00.000Z")), "2026-10-14");
  });

  test("rejects trailing text, times and offsets instead of dropping them", () => {
    assert.equal(d("2026-10-14garbage"), null);
    assert.equal(d("2026-10-14T23:00-05:00"), null);
    assert.equal(d("2026-10-14T10:30:00Z"), null);
    assert.equal(d("2026-10-1"), null);
  });

  test("rejects years outside 1900–2100", () => {
    assert.equal(d("0226-10-14"), null);
    assert.equal(d("9026-10-14"), null);
    assert.equal(toDateOnlyString(d("1900-01-01")), "1900-01-01");
    assert.equal(toDateOnlyString(d("2100-12-31")), "2100-12-31");
  });

  test("transactions may be dated up to a year ahead", () => {
    const now = new Date("2026-10-14T12:00:00Z");
    assert.equal(toDateOnlyString(latestTransactionDate(now)), "2027-10-15");
  });
});
