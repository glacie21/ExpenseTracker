import { test } from "node:test";
import assert from "node:assert/strict";
import {
  detectHeaderIndices,
  parseImportAmount,
  normalizeImportDate,
  parseImportType,
} from "../../src/lib/transactionsImportUtils.ts";

test("detectHeaderIndices recognises standard Indonesian headers", () => {
  const headers = ["Tanggal", "Judul", "Tipe", "Kategori", "Nominal", "Deskripsi"];
  const res = detectHeaderIndices(headers);
  assert.ok(res.indices);
  assert.equal(res.indices.dateCol, 0);
  assert.equal(res.indices.titleCol, 1);
  assert.equal(res.indices.typeCol, 2);
  assert.equal(res.indices.categoryCol, 3);
  assert.equal(res.indices.amountCol, 4);
  assert.equal(res.indices.descCol, 5);
});

test("detectHeaderIndices recognises English headers", () => {
  const headers = ["Date", "Title", "Type", "Category", "Amount", "Notes"];
  const res = detectHeaderIndices(headers);
  assert.ok(res.indices);
  assert.equal(res.indices.dateCol, 0);
  assert.equal(res.indices.titleCol, 1);
  assert.equal(res.indices.descCol, 5);
});

test("detectHeaderIndices fails if required headers are missing", () => {
  const res = detectHeaderIndices(["Nama", "Kategori"]);
  assert.equal(res.indices, null);
  assert.match(res.error, /Kolom wajib tidak ditemukan/);
});

test("normalizeImportDate rewrites DD/MM/YYYY and leaves other values for parseDateOnly", () => {
  assert.equal(normalizeImportDate("2026-10-15"), "2026-10-15");
  assert.equal(normalizeImportDate("15/10/2026"), "2026-10-15");
  assert.equal(normalizeImportDate("5-4-2026"), "2026-04-05");
  assert.equal(normalizeImportDate("invalid-date"), "invalid-date");
});

test("parseImportAmount strips currency, sign and Indonesian/US separators", () => {
  assert.equal(parseImportAmount("50000"), "50000");
  assert.equal(parseImportAmount("50000.50"), "50000.50");
  assert.equal(parseImportAmount("Rp 1.500.000"), "1500000");
  assert.equal(parseImportAmount("Rp50.000"), "50000");
  assert.equal(parseImportAmount("1.250.000,50"), "1250000.50");
  assert.equal(parseImportAmount("1,250,000.50"), "1250000.50");
  assert.equal(parseImportAmount("-75000"), "75000");
  assert.equal(parseImportAmount("(75000)"), "75000");
  // Validity (zero, letters) is decided later by normalizeAmount
  assert.equal(parseImportAmount("abc"), "abc");
});

test("parseImportType normalises Indonesian and English types", () => {
  assert.equal(parseImportType("INCOME"), "INCOME");
  assert.equal(parseImportType("Pemasukan"), "INCOME");
  assert.equal(parseImportType("Masuk"), "INCOME");
  assert.equal(parseImportType("Kredit"), "INCOME");

  assert.equal(parseImportType("EXPENSE"), "EXPENSE");
  assert.equal(parseImportType("Pengeluaran"), "EXPENSE");
  assert.equal(parseImportType("Keluar"), "EXPENSE");
  assert.equal(parseImportType("Debit"), "EXPENSE");
});

test("parseImportType falls back to EXPENSE for unknown values", () => {
  assert.equal(parseImportType(""), "EXPENSE");
  assert.equal(parseImportType("lainnya", "INCOME"), "INCOME");
});
