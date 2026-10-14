/**
 * End-to-end API tests for Tahap 2 (transactions, categories, dashboard).
 *
 * Requires the app and database to be running:
 *   npm run db:start   (or any PostgreSQL from DATABASE_URL)
 *   npm run dev        (or npm run build && npm start)
 *   npm test           (BASE_URL defaults to http://localhost:3000)
 *
 * Each run registers fresh users and deletes them (cascading to their
 * categories and transactions) when finished.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const RUN_ID = `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
const EMAIL_DOMAIN = "test.expense-tracker.local";

const prisma = new PrismaClient();

/** Minimal API client that keeps the session cookie of one user. */
class Client {
  constructor() {
    this.cookie = "";
  }

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
    const isJson = res.headers.get("content-type")?.includes("application/json");
    return { status: res.status, headers: res.headers, json: isJson ? await res.json() : null };
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
    name: `Test ${label}`,
    email: `${label}-${RUN_ID}@${EMAIL_DOMAIN}`,
    password: "Password123!",
    confirmPassword: "Password123!",
  });
  assert.equal(res.status, 201, `register ${label}: ${JSON.stringify(res.json)}`);
  assert.ok(client.cookie, "session cookie is set");
  return client;
}

async function getCategories(client) {
  const res = await client.get("/api/categories");
  assert.equal(res.status, 200);
  return res.json.data.categories;
}

async function getSummary(client) {
  const res = await client.get("/api/dashboard/summary");
  assert.equal(res.status, 200);
  return res.json.data.summary;
}

let alice;
let bob;
let aliceCategories;
let salary;
let food;

before(async () => {
  const health = await fetch(BASE_URL).catch(() => null);
  if (!health) {
    throw new Error(`App is not reachable at ${BASE_URL}. Start it with "npm run dev" first.`);
  }
  alice = await registerUser("alice");
  bob = await registerUser("bob");
  aliceCategories = await getCategories(alice);
  salary = aliceCategories.find((c) => c.name === "Gaji" && c.type === "INCOME");
  food = aliceCategories.find((c) => c.name === "Makan & minum" && c.type === "EXPENSE");
});

after(async () => {
  await prisma.user.deleteMany({
    where: { email: { endsWith: `-${RUN_ID}@${EMAIL_DOMAIN}` } },
  });
  await prisma.$disconnect();
});

describe("categories", () => {
  test("new users get the default categories without duplicates", async () => {
    assert.equal(aliceCategories.length, 13);
    assert.ok(salary && food);

    // Loading again must not create duplicates
    const again = await getCategories(alice);
    assert.equal(again.length, 13);
  });

  test("a category can be created, renamed and deleted", async () => {
    const created = await alice.post("/api/categories", {
      name: "Hobi",
      type: "EXPENSE",
      color: "#ec4899",
    });
    assert.equal(created.status, 201);
    const id = created.json.data.category.id;

    const duplicate = await alice.post("/api/categories", { name: "hobi", type: "EXPENSE" });
    assert.equal(duplicate.status, 409, "names are unique per type, case-insensitive");

    const renamed = await alice.put(`/api/categories/${id}`, { name: "Hobi & Game" });
    assert.equal(renamed.status, 200);
    assert.equal(renamed.json.data.category.name, "Hobi & Game");

    const removed = await alice.delete(`/api/categories/${id}`);
    assert.equal(removed.status, 200);
  });

  test("a category in use cannot be deleted and its transactions are kept", async () => {
    const created = await alice.post("/api/categories", { name: "Sementara", type: "EXPENSE" });
    const categoryId = created.json.data.category.id;
    const tx = await alice.post("/api/transactions", {
      type: "EXPENSE",
      title: "Pakai kategori",
      amount: "1000",
      categoryId,
      date: "2026-01-05",
    });
    assert.equal(tx.status, 201);

    const removed = await alice.delete(`/api/categories/${categoryId}`);
    assert.equal(removed.status, 400);

    const stillThere = await alice.get(`/api/transactions/${tx.json.data.transaction.id}`);
    assert.equal(stillThere.status, 200);

    await alice.delete(`/api/transactions/${tx.json.data.transaction.id}`);
    assert.equal((await alice.delete(`/api/categories/${categoryId}`)).status, 200);
  });

  test("another user's categories are not accessible", async () => {
    assert.equal((await bob.put(`/api/categories/${food.id}`, { name: "Hacked" })).status, 404);
    assert.equal((await bob.delete(`/api/categories/${food.id}`)).status, 404);
  });
});

describe("transactions", () => {
  let incomeId;
  let expenseId;

  test("1. user can add an income", async () => {
    const res = await alice.post("/api/transactions", {
      type: "INCOME",
      title: "Gaji bulanan",
      amount: "5000000",
      categoryId: salary.id,
      date: "2026-10-08",
    });
    assert.equal(res.status, 201);
    const tx = res.json.data.transaction;
    assert.equal(tx.type, "INCOME");
    assert.equal(tx.amount, 5000000);
    assert.equal(tx.category.id, salary.id);
    incomeId = tx.id;
  });

  test("2. user can add an expense", async () => {
    const res = await alice.post("/api/transactions", {
      type: "EXPENSE",
      title: "Makan siang",
      amount: 25000.5,
      categoryId: food.id,
      date: "2026-10-09",
      description: "Nasi padang",
    });
    assert.equal(res.status, 201);
    assert.equal(res.json.data.transaction.amount, 25000.5);
    expenseId = res.json.data.transaction.id;
  });

  test("dates with trailing text, a time, or an absurd year are rejected", async () => {
    for (const date of ["2026-10-09garbage", "2026-10-09T23:00-05:00", "9026-10-09", "2126-10-09"]) {
      const res = await alice.post("/api/transactions", {
        type: "EXPENSE",
        title: "Tanggal aneh",
        amount: "1000",
        categoryId: food.id,
        date,
      });
      assert.equal(res.status, 400, date);
      assert.ok(res.json.errors.date, date);
    }
  });

  test("transaction dates do not shift across timezones", async () => {
    const res = await alice.get(`/api/transactions/${expenseId}`);
    assert.equal(res.json.data.transaction.date, "2026-10-09T00:00:00.000Z");
  });

  test("3. user can edit their own transaction", async () => {
    const res = await alice.put(`/api/transactions/${expenseId}`, {
      type: "EXPENSE",
      title: "Makan malam",
      amount: "30000",
      categoryId: food.id,
      date: "2026-10-10",
      description: "",
    });
    assert.equal(res.status, 200);
    const tx = res.json.data.transaction;
    assert.equal(tx.title, "Makan malam");
    assert.equal(tx.amount, 30000);
    assert.equal(tx.description, null);
  });

  test("8. zero, negative and malformed amounts are rejected", async () => {
    for (const amount of [0, "0", "0.00", -5000, "-1", "abc", "1.234", "", null]) {
      const res = await alice.post("/api/transactions", {
        type: "EXPENSE",
        title: "Invalid",
        amount,
        categoryId: food.id,
        date: "2026-10-10",
      });
      assert.equal(res.status, 400, `amount ${JSON.stringify(amount)} must be rejected`);
      assert.ok(res.json.errors.amount);
    }
  });

  test("9. invalid categories are rejected", async () => {
    const base = { title: "Invalid", amount: "1000", date: "2026-10-10" };

    // Expense category used for an income
    let res = await alice.post("/api/transactions", { ...base, type: "INCOME", categoryId: food.id });
    assert.equal(res.status, 400);
    assert.ok(res.json.errors.categoryId);

    // Non-existent category
    res = await alice.post("/api/transactions", { ...base, type: "EXPENSE", categoryId: "doesnotexist123" });
    assert.equal(res.status, 400);

    // Another user's category
    const bobFood = (await getCategories(bob)).find((c) => c.type === "EXPENSE");
    res = await alice.post("/api/transactions", { ...base, type: "EXPENSE", categoryId: bobFood.id });
    assert.equal(res.status, 400);
  });

  test("other invalid input is rejected", async () => {
    const base = { type: "EXPENSE", title: "Ok", amount: "1000", categoryId: food.id, date: "2026-10-10" };
    for (const override of [{ type: "TRANSFER" }, { title: "" }, { date: "2026-02-30" }, { date: "kemarin" }]) {
      const res = await alice.post("/api/transactions", { ...base, ...override });
      assert.equal(res.status, 400, `${JSON.stringify(override)} must be rejected`);
    }
  });

  test("5. user can search, filter, sort and paginate transactions", async () => {
    // Extra data in another month
    await alice.post("/api/transactions", {
      type: "INCOME",
      title: "Proyek freelance",
      amount: "750000",
      categoryId: aliceCategories.find((c) => c.name === "Pekerjaan lepas").id,
      date: "2026-09-15",
      description: "Desain logo",
    });

    let res = await alice.get("/api/transactions?type=INCOME");
    assert.equal(res.json.data.pagination.total, 2);
    assert.ok(res.json.data.transactions.every((t) => t.type === "INCOME"));

    res = await alice.get("/api/transactions?search=LOGO");
    assert.deepEqual(res.json.data.transactions.map((t) => t.title), ["Proyek freelance"]);

    res = await alice.get(`/api/transactions?categoryId=${food.id}`);
    assert.deepEqual(res.json.data.transactions.map((t) => t.title), ["Makan malam"]);

    res = await alice.get("/api/transactions?year=2026&month=9");
    assert.deepEqual(res.json.data.transactions.map((t) => t.title), ["Proyek freelance"]);

    res = await alice.get("/api/transactions?startDate=2026-10-08&endDate=2026-10-08");
    assert.deepEqual(res.json.data.transactions.map((t) => t.title), ["Gaji bulanan"]);

    res = await alice.get("/api/transactions?sort=oldest");
    assert.equal(res.json.data.transactions[0].title, "Proyek freelance");

    res = await alice.get("/api/transactions?limit=2&page=2");
    assert.equal(res.json.data.transactions.length, 1);
    assert.deepEqual(res.json.data.pagination, { page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  test("10. dashboard summary follows the stored transactions", async () => {
    let summary = await getSummary(alice);
    assert.equal(summary.totalIncome, 5750000);
    assert.equal(summary.totalExpense, 30000);
    assert.equal(summary.totalBalance, 5720000);
    assert.equal(summary.netSavings, 5720000);
    assert.equal(summary.totalCount, 3);

    const recent = (await alice.get("/api/dashboard/summary")).json.data.recentTransactions;
    assert.equal(recent[0].title, "Makan malam");

    // Bob has no transactions: everything starts at zero
    summary = await getSummary(bob);
    assert.equal(summary.totalBalance, 0);
    assert.equal(summary.totalCount, 0);
  });

  test("6. a user cannot read another user's transactions", async () => {
    assert.equal((await bob.get(`/api/transactions/${incomeId}`)).status, 404);
    const list = await bob.get("/api/transactions");
    assert.equal(list.json.data.pagination.total, 0);
  });

  test("7. a user cannot edit or delete another user's transactions", async () => {
    const bobFood = (await getCategories(bob)).find((c) => c.type === "EXPENSE");
    const edit = await bob.put(`/api/transactions/${expenseId}`, {
      type: "EXPENSE",
      title: "Hacked",
      amount: "1",
      categoryId: bobFood.id,
      date: "2026-10-10",
    });
    assert.equal(edit.status, 404);
    assert.equal((await bob.delete(`/api/transactions/${expenseId}`)).status, 404);

    const unchanged = await alice.get(`/api/transactions/${expenseId}`);
    assert.equal(unchanged.json.data.transaction.title, "Makan malam");
  });

  test("12. transactions persist across requests (page reload)", async () => {
    const reloaded = new Client();
    reloaded.cookie = alice.cookie;
    const res = await reloaded.get("/api/transactions");
    assert.equal(res.json.data.pagination.total, 3);

    const page = await reloaded.get("/transactions");
    assert.equal(page.status, 200);
  });

  test("4. user can delete their own transaction and the summary updates", async () => {
    assert.equal((await alice.delete(`/api/transactions/${expenseId}`)).status, 200);
    assert.equal((await alice.get(`/api/transactions/${expenseId}`)).status, 404);

    const summary = await getSummary(alice);
    assert.equal(summary.totalExpense, 0);
    assert.equal(summary.totalBalance, 5750000);
  });
});

describe("authentication", () => {
  test("11. unauthenticated users cannot use the features", async () => {
    const anon = new Client();
    for (const path of ["/api/transactions", "/api/categories", "/api/dashboard/summary"]) {
      assert.equal((await anon.get(path)).status, 401, path);
    }
    assert.equal(
      (await anon.post("/api/transactions", { type: "INCOME", title: "x", amount: 1 })).status,
      401
    );

    for (const path of ["/dashboard", "/transactions", "/categories"]) {
      const res = await anon.get(path);
      assert.equal(res.status, 307, path);
      assert.match(res.headers.get("location"), /\/login\?redirect=/);
    }
  });

  test("a forged session cookie is rejected", async () => {
    const forged = new Client();
    forged.cookie = "expense_tracker_session=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ4In0.invalid";
    assert.equal((await forged.get("/api/transactions")).status, 401);
  });
});
