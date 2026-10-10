/**
 * Unit tests for the CSV writer (src/lib/csv.ts).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { CSV_BOM, csvHeader, csvRows, escapeCsvField } from "../../src/lib/csv.ts";

test("plain values are left as is", () => {
  assert.equal(escapeCsvField("Makan siang"), "Makan siang");
  assert.equal(escapeCsvField(5000), "5000");
  assert.equal(escapeCsvField(null), "");
});

test("commas, quotes and newlines are quoted", () => {
  assert.equal(escapeCsvField("Kopi, roti"), '"Kopi, roti"');
  assert.equal(escapeCsvField('Kata "hemat"'), '"Kata ""hemat"""');
  assert.equal(escapeCsvField("baris 1\nbaris 2"), '"baris 1\nbaris 2"');
});

test("formula-like untrusted text is neutralised", () => {
  assert.equal(escapeCsvField("=HYPERLINK(\"http://x\")"), "\"'=HYPERLINK(\"\"http://x\"\")\"");
  assert.equal(escapeCsvField("+1+1"), "'+1+1");
  assert.equal(escapeCsvField("-5"), "'-5");
  assert.equal(escapeCsvField("@SUM(A1)"), "'@SUM(A1)");
});

test("trusted app values are not prefixed", () => {
  assert.equal(escapeCsvField("-5000.00", true), "-5000.00");
});

test("header and rows use CRLF; BOM marks UTF-8", () => {
  const columns = [
    { header: "Judul", value: (r) => r.title },
    { header: "Nominal", value: (r) => r.amount, trusted: true },
  ];
  assert.equal(csvHeader(columns), "Judul,Nominal\r\n");
  assert.equal(csvRows(columns, [{ title: "Gaji", amount: "5000000.00" }]), "Gaji,5000000.00\r\n");
  assert.equal(CSV_BOM, "﻿");
});
