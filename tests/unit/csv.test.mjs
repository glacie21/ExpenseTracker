/**
 * Unit tests for the CSV writer (src/lib/csv.ts).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { CSV_BOM, csvHeader, csvRows, escapeCsvField, cleanCsvField, parseCsv } from "../../src/lib/csv.ts";

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

test("cleanCsvField strips formula escape prefix and trims", () => {
  assert.equal(cleanCsvField("  normal text  "), "normal text");
  assert.equal(cleanCsvField("'+1234"), "+1234");
  assert.equal(cleanCsvField("'=SUM(A1)"), "=SUM(A1)");
  assert.equal(cleanCsvField("'-5000"), "-5000");
  assert.equal(cleanCsvField("'Normal"), "'Normal");
});

test("parseCsv handles standard comma-separated and quoted fields", () => {
  const csv = 'Tanggal,Judul,Nominal\r\n2026-10-01,"Makan, siang",50000\r\n2026-10-02,Transport,15000';
  const parsed = parseCsv(csv);
  assert.equal(parsed.length, 3);
  assert.deepEqual(parsed[0], ["Tanggal", "Judul", "Nominal"]);
  assert.deepEqual(parsed[1], ["2026-10-01", "Makan, siang", "50000"]);
  assert.deepEqual(parsed[2], ["2026-10-02", "Transport", "15000"]);
});

test("parseCsv handles semicolon delimiters and BOM", () => {
  const csv = `${CSV_BOM}Tanggal;Judul;Nominal\r\n2026-10-01;Gaji;8500000`;
  const parsed = parseCsv(csv);
  assert.equal(parsed.length, 2);
  assert.deepEqual(parsed[0], ["Tanggal", "Judul", "Nominal"]);
  assert.deepEqual(parsed[1], ["2026-10-01", "Gaji", "8500000"]);
});

test("parseCsv handles escaped quotes and newlines in quoted cells", () => {
  const csv = 'Judul,Deskripsi\r\n"Kata ""kutip""","Baris 1\nBaris 2"';
  const parsed = parseCsv(csv);
  assert.equal(parsed.length, 2);
  assert.deepEqual(parsed[1], ['Kata "kutip"', "Baris 1\nBaris 2"]);
});


test("parseCsv returns raw fields and skips a trailing empty line", () => {
  const parsed = parseCsv('a, b ,"  c  "\r\n\'=1,x,y\r\n');
  assert.deepEqual(parsed, [["a", " b ", "  c  "], ["'=1", "x", "y"]]);
  assert.deepEqual(parsed[1].map(cleanCsvField), ["=1", "x", "y"]);
  assert.deepEqual(parseCsv(""), []);
  assert.deepEqual(parseCsv("a;b,c;d\nx;y,z;w"), [["a", "b,c", "d"], ["x", "y,z", "w"]]);
});
