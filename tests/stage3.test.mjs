/**
 * Integration tests for Tahap 3: analytics, reports, CSV/PDF export, budgets
 * and cross-user security. Requires the app and database to be running
 * (see tests/api.test.mjs). Test users are deleted after the run.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { PDFDocument } from "pdf-lib";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const RUN_ID = `s3${Date.now()}${Math.floor(Math.random() * 1e6)}`;
const EMAIL_DOMAIN = "test.expense-tracker.local";
const prisma = new PrismaClient();

class Client {
  cookie = "";

  async request(method, path, body) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      redirect: "manual",
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(this.cookie ? { Cookie: this.cookie } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) this.cookie = setCookie.split(";")[0];
    const type = res.headers.get("content-type") || "";
    let payload;
    if (type.includes("application/json")) payload = await res.json();
    else if (type.includes("application/pdf")) payload = new Uint8Array(await res.arrayBuffer());
    // Response.text() strips a UTF-8 BOM; decode manually to be able to assert it
    else payload = new TextDecoder("utf-8", { ignoreBOM: true }).decode(await res.arrayBuffer());
    return { status: res.status, headers: res.headers, json: payload, body: payload };
  }
  get(path) {
    return this.request("GET", path);
  }
  post(path, body) {
    return this.request("POST", path, body);
  }
  put(path, body) {
    return this.request("PUT", path, body);
  }
  delete(path) {
    return this.request("DELETE", path);
  }
}

async function registerUser(label) {
  const client = new Client();
  const res = await client.post("/api/auth/register", {
    name: `Stage3 ${label}`,
    email: `${label}-${RUN_ID}@${EMAIL_DOMAIN}`,
    password: "Password123!",
    confirmPassword: "Password123!",
  });
  assert.equal(res.status, 201);
  const categories = (await client.get("/api/categories")).json.data.categories;
  const cat = (name) => categories.find((c) => c.name === name);
  return { client, cat };
}

let alice;
let bob;

async function addTx(user, type, category, amount, date, title = `${type} ${date}`, description) {
  const res = await user.client.post("/api/transactions", {
    type,
    title,
    amount,
    categoryId: user.cat(category).id,
    date,
    description,
  });
  assert.equal(res.status, 201, JSON.stringify(res.json));
  return res.json.data.transaction;
}

before(async () => {
  const health = await fetch(BASE_URL).catch(() => null);
  if (!health) throw new Error(`App is not reachable at ${BASE_URL}. Start it with "npm run dev" first.`);
  alice = await registerUser("alice");
  bob = await registerUser("bob");

  // February 2024 (previous period) and March 2024 (current period)
  await addTx(alice, "INCOME", "Gaji", "4000000", "2024-02-01");
  await addTx(alice, "EXPENSE", "Makan & minum", "100000", "2024-02-10");
  await addTx(alice, "INCOME", "Gaji", "5000000", "2024-03-01"); // first day: boundary
  await addTx(alice, "EXPENSE", "Makan & minum", "250000.50", "2024-03-05", "Makan, \"enak\"", "baris 1\nbaris 2");
  await addTx(alice, "EXPENSE", "Tagihan", "750000", "2024-03-31"); // last day: boundary
  await addTx(alice, "EXPENSE", "Belanja", "1000", "2024-03-15", "=HYPERLINK(\"http://evil\")");
  await addTx(bob, "EXPENSE", "Tagihan", "999999", "2024-03-10", "Bob secret bill");
});

after(async () => {
  await prisma.user.deleteMany({ where: { email: { endsWith: `-${RUN_ID}@${EMAIL_DOMAIN}` } } });
  await prisma.$disconnect();
});

const MARCH = "startDate=2024-03-01&endDate=2024-03-31";

describe("analytics (dashboard)", () => {
  test("period totals, savings rate and trends for a custom range", async () => {
    const res = await alice.client.get("/api/analytics?period=custom&start=2024-03-01&end=2024-03-31");
    assert.equal(res.status, 200);
    const { summary, trends } = res.json.data;
    assert.equal(summary.totalIncome, 5000000);
    assert.equal(summary.totalExpense, 1001000.5);
    assert.equal(summary.netBalance, 3998999.5);
    assert.equal(Math.round(summary.savingsRate * 100) / 100, 79.98);
    // Custom range compares with the same number of days before (30 Jan - 29 Feb)
    assert.equal(trends.income.previous, 4000000);
    assert.equal(trends.income.percent, 25);
  });

  test("chart buckets include the first and last day of the range", async () => {
    const res = await alice.client.get("/api/analytics?period=custom&start=2024-03-01&end=2024-03-31");
    const { granularity, series } = res.json.data;
    assert.equal(granularity, "day");
    assert.equal(series.length, 31);
    assert.deepEqual(series[0], { date: "2024-03-01", income: 5000000, expense: 0 });
    assert.deepEqual(series[30], { date: "2024-03-31", income: 0, expense: 750000 });
    const total = series.reduce((s, p) => s + p.expense, 0);
    assert.equal(Math.round(total * 100), 100100050);
  });

  test("expense breakdown is sorted and shares add up to 100%", async () => {
    const res = await alice.client.get("/api/analytics?period=custom&start=2024-03-01&end=2024-03-31");
    const { breakdown } = res.json.data;
    assert.deepEqual(breakdown.map((b) => b.name), ["Tagihan", "Makan & minum", "Belanja"]);
    const sum = breakdown.reduce((s, b) => s + b.percent, 0);
    assert.ok(Math.abs(sum - 100) < 1e-9);
  });

  test("no previous data gives no percentage; no income gives 0% savings rate", async () => {
    const res = await bob.client.get("/api/analytics?period=custom&start=2024-03-01&end=2024-03-31");
    const { summary, trends } = res.json.data;
    assert.equal(summary.savingsRate, 0);
    assert.equal(trends.expense.percent, null);
    assert.equal(trends.expense.difference, 999999);
  });

  test("invalid periods are rejected", async () => {
    for (const q of ["period=decade", "period=custom&start=2024-03-10&end=2024-03-01", "period=custom"]) {
      assert.equal((await alice.client.get(`/api/analytics?${q}`)).status, 400, q);
    }
  });

  test("dashboard page renders the selected period", async () => {
    const res = await alice.client.get("/dashboard?period=custom&start=2024-03-01&end=2024-03-31");
    assert.equal(res.status, 200);
    for (const text of ["Neraca periode", "Tingkat tabungan", "Arus kas", "Pengeluaran per kategori", "Rp5.000.000"]) {
      assert.ok(res.body.includes(text), text);
    }
  });
});

describe("reports", () => {
  test("summary, top category and increases follow the filters", async () => {
    const res = await alice.client.get(`/api/reports?${MARCH}&periodType=month`);
    assert.equal(res.status, 200);
    const report = res.json.data;
    assert.equal(report.summary.transactionCount, 4);
    assert.equal(report.topExpenseCategory.name, "Tagihan");
    assert.equal(report.period.previousStart, "2024-02-01");
    const food = report.categoryIncreases.find((c) => c.name === "Makan & minum");
    assert.equal(food.difference, 150000.5);
    assert.equal(food.percent, 150.0005);
    const bills = report.categoryIncreases.find((c) => c.name === "Tagihan");
    assert.equal(bills.percent, null, "new category spending has no percentage");
  });

  test("type and category filters are applied", async () => {
    let res = await alice.client.get(`/api/reports?${MARCH}&type=INCOME`);
    assert.equal(res.json.data.summary.totalExpense, 0);
    assert.equal(res.json.data.summary.totalIncome, 5000000);
    assert.equal(res.json.data.breakdown.length, 0);

    res = await alice.client.get(`/api/reports?${MARCH}&categoryId=${alice.cat("Tagihan").id}`);
    assert.equal(res.json.data.summary.totalExpense, 750000);
    assert.equal(res.json.data.summary.transactionCount, 1);
    assert.equal(res.json.data.filters.category.name, "Tagihan");
  });

  test("invalid report filters are rejected by the backend", async () => {
    for (const q of [
      "startDate=2024-03-31&endDate=2024-03-01",
      "startDate=2024-02-30&endDate=2024-03-01",
      `${MARCH}&type=TRANSFER`,
      `${MARCH}&periodType=decade`,
      `${MARCH}&categoryId=bad id!`,
      "startDate=2010-01-01&endDate=2024-01-01",
    ]) {
      assert.equal((await alice.client.get(`/api/reports?${q}`)).status, 400, q);
    }
  });

  test("a user's report never contains another user's data", async () => {
    const res = await bob.client.get(`/api/reports?${MARCH}`);
    assert.equal(res.json.data.summary.transactionCount, 1);
    assert.equal(res.json.data.summary.totalExpense, 999999);

    // Using Alice's category id as a filter yields nothing for Bob
    const filtered = await bob.client.get(`/api/reports?${MARCH}&categoryId=${alice.cat("Tagihan").id}`);
    assert.equal(filtered.json.data.summary.transactionCount, 0);
    assert.equal(filtered.json.data.filters.category, null);
  });
});

describe("CSV export", () => {
  test("exports the filtered transactions of the signed-in user as UTF-8 CSV", async () => {
    const res = await alice.client.get(`/api/transactions/export?${MARCH}&sort=oldest`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /text\/csv; charset=utf-8/);
    assert.match(res.headers.get("content-disposition"), /attachment; filename="transaksi-.*\.csv"/);

    const csv = res.body;
    assert.ok(csv.startsWith("﻿"), "UTF-8 BOM");
    const lines = csv.slice(1).split("\r\n");
    assert.equal(lines[0], "Tanggal,Judul,Tipe,Kategori,Nominal,Deskripsi");
    assert.equal(lines[1], "2024-03-01,INCOME 2024-03-01,INCOME,Gaji,5000000.00,");
    // Comma, quotes and newline are quoted correctly
    assert.ok(csv.includes('2024-03-05,"Makan, ""enak""",EXPENSE,Makan & minum,250000.50,"baris 1\nbaris 2"'));
    // Formula injection is neutralised
    assert.ok(csv.includes(`"'=HYPERLINK(""http://evil"")"`));
    assert.ok(!csv.includes("Bob secret bill"));
    assert.ok(!csv.includes("2024-02-"), "date filter applied");
  });

  test("respects type filter and reports when there is nothing to export", async () => {
    const res = await alice.client.get(`/api/transactions/export?${MARCH}&type=INCOME`);
    assert.equal(res.body.trim().split("\r\n").length, 2);

    const empty = await alice.client.get("/api/transactions/export?startDate=2020-01-01&endDate=2020-01-31");
    assert.equal(empty.status, 404);
    assert.ok(empty.json.message);
  });

  test("only contains the requesting user's data", async () => {
    const res = await bob.client.get(`/api/transactions/export?${MARCH}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("Bob secret bill"));
    assert.ok(!res.body.includes("Gaji"));
  });

  test("validates filters on the backend", async () => {
    assert.equal((await alice.client.get("/api/transactions/export?type=FOO")).status, 400);
    assert.equal((await alice.client.get("/api/transactions/export?startDate=nope")).status, 400);
  });
});

describe("PDF report", () => {
  test("downloads a valid PDF for the filtered period", async () => {
    const res = await alice.client.get(`/api/reports/pdf?${MARCH}&periodType=month`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "application/pdf");
    assert.match(res.headers.get("content-disposition"), /laporan-2024-03-01_2024-03-31\.pdf/);
    assert.equal(Buffer.from(res.body.slice(0, 5)).toString(), "%PDF-");
    const doc = await PDFDocument.load(res.body);
    assert.ok(doc.getPageCount() >= 1);
    assert.match(doc.getTitle(), /Laporan Keuangan/);
  });

  test("an empty period still produces a report", async () => {
    const res = await alice.client.get("/api/reports/pdf?startDate=2020-01-01&endDate=2020-01-31");
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "application/pdf");
  });

  test("rejects invalid filters", async () => {
    assert.equal((await alice.client.get("/api/reports/pdf?startDate=2024-03-31&endDate=2024-03-01")).status, 400);
  });
});

describe("budgets", () => {
  let foodBudgetId;

  test("budget progress follows actual expenses of that category and month", async () => {
    const created = await alice.client.post("/api/budgets", {
      categoryId: alice.cat("Makan & minum").id,
      amount: "300000",
      month: 3,
      year: 2024,
    });
    assert.equal(created.status, 201);
    foodBudgetId = created.json.data.budget.id;

    const res = await alice.client.get("/api/budgets?month=3&year=2024");
    const food = res.json.data.budgets.find((b) => b.id === foodBudgetId);
    // Only the March Makan & minum expense counts (not February, not other categories)
    assert.equal(food.spent, 250000.5);
    assert.equal(food.remaining, 49999.5);
    assert.equal(food.status, "warning"); // 83.3%
  });

  test("editing and deleting transactions updates progress (over budget)", async () => {
    const tx = await addTx(alice, "EXPENSE", "Makan & minum", "100000", "2024-03-20");
    let food = (await alice.client.get("/api/budgets?month=3&year=2024")).json.data.budgets.find(
      (b) => b.id === foodBudgetId
    );
    assert.equal(food.status, "over");
    assert.equal(food.remaining, -50000.5);
    assert.ok(food.percent > 100);

    // Lower the amount so spending equals the budget exactly
    await alice.client.put(`/api/transactions/${tx.id}`, {
      type: "EXPENSE",
      title: tx.title,
      amount: "49999.50",
      categoryId: alice.cat("Makan & minum").id,
      date: "2024-03-20",
    });
    food = (await alice.client.get("/api/budgets?month=3&year=2024")).json.data.budgets.find(
      (b) => b.id === foodBudgetId
    );
    assert.equal(food.status, "reached");
    assert.equal(food.remaining, 0);

    await alice.client.delete(`/api/transactions/${tx.id}`);
    food = (await alice.client.get("/api/budgets?month=3&year=2024")).json.data.budgets.find(
      (b) => b.id === foodBudgetId
    );
    assert.equal(food.spent, 250000.5);
  });

  test("validation: positive amount, expense category, no duplicates", async () => {
    const base = { categoryId: alice.cat("Tagihan").id, amount: "1000", month: 3, year: 2024 };
    for (const override of [{ amount: 0 }, { amount: "-5" }, { month: 13 }, { year: 1999 }]) {
      assert.equal((await alice.client.post("/api/budgets", { ...base, ...override })).status, 400);
    }
    const income = await alice.client.post("/api/budgets", { ...base, categoryId: alice.cat("Gaji").id });
    assert.equal(income.status, 400);

    const duplicate = await alice.client.post("/api/budgets", { ...base, categoryId: alice.cat("Makan & minum").id });
    assert.equal(duplicate.status, 409);
  });

  test("budgets are isolated between users", async () => {
    assert.equal((await bob.client.get("/api/budgets?month=3&year=2024")).json.data.budgets.length, 0);
    const update = await bob.client.put(`/api/budgets/${foodBudgetId}`, {
      categoryId: bob.cat("Makan & minum").id,
      amount: "1",
      month: 3,
      year: 2024,
    });
    assert.equal(update.status, 404);
    assert.equal((await bob.client.delete(`/api/budgets/${foodBudgetId}`)).status, 404);
    // Bob cannot attach a budget to Alice's category
    const foreign = await bob.client.post("/api/budgets", {
      categoryId: alice.cat("Tagihan").id,
      amount: "1",
      month: 3,
      year: 2024,
    });
    assert.equal(foreign.status, 400);
  });

  test("a category with budgets cannot be deleted; budget can be edited and deleted", async () => {
    const created = await alice.client.post("/api/categories", { name: "Temp Budget", type: "EXPENSE" });
    const categoryId = created.json.data.category.id;
    const budget = await alice.client.post("/api/budgets", { categoryId, amount: "1000", month: 4, year: 2024 });
    assert.equal((await alice.client.delete(`/api/categories/${categoryId}`)).status, 400);

    const edited = await alice.client.put(`/api/budgets/${budget.json.data.budget.id}`, {
      categoryId,
      amount: "2000",
      month: 5,
      year: 2024,
    });
    assert.equal(edited.status, 200);
    assert.equal(edited.json.data.budget.amount, 2000);
    assert.equal(edited.json.data.budget.month, 5);

    assert.equal((await alice.client.delete(`/api/budgets/${budget.json.data.budget.id}`)).status, 200);
    assert.equal((await alice.client.delete(`/api/categories/${categoryId}`)).status, 200);
  });
});

describe("authentication for stage 3 features", () => {
  test("unauthenticated requests are rejected", async () => {
    const anon = new Client();
    for (const path of [
      "/api/analytics?period=this_month",
      `/api/reports?${MARCH}`,
      `/api/reports/pdf?${MARCH}`,
      "/api/transactions/export",
      "/api/budgets",
    ]) {
      assert.equal((await anon.get(path)).status, 401, path);
    }
    assert.equal((await anon.post("/api/budgets", {})).status, 401);
    for (const path of ["/reports", "/budgets"]) {
      const res = await anon.get(path);
      assert.equal(res.status, 307, path);
      assert.match(res.headers.get("location"), /\/login\?redirect=/);
    }
  });
});
