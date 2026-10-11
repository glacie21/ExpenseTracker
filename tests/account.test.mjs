/**
 * End-to-end API tests for account security: login rate limiting, password
 * rules, profile, password change, session revocation and account deletion.
 *
 * Requires the app and database to be running (see tests/api.test.mjs).
 * Users are created with unique emails and deleted when finished.
 */
import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const RUN_ID = `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
const EMAIL_DOMAIN = "test.expense-tracker.local";
const PASSWORD = "Password123!";

const prisma = new PrismaClient();

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
  delete(path, body) {
    return this.request("DELETE", path, body);
  }
}

const emailFor = (label) => `${label}-${RUN_ID}@${EMAIL_DOMAIN}`;

async function registerUser(label) {
  const client = new Client();
  const res = await client.post("/api/auth/register", {
    name: `Test ${label}`,
    email: emailFor(label),
    password: PASSWORD,
    confirmPassword: PASSWORD,
  });
  assert.equal(res.status, 201, `register ${label}: ${JSON.stringify(res.json)}`);
  return client;
}

async function login(label, password = PASSWORD) {
  const client = new Client();
  const res = await client.post("/api/auth/login", { email: emailFor(label), password });
  return { client, res };
}

after(async () => {
  await prisma.user.deleteMany({
    where: { email: { endsWith: `-${RUN_ID}@${EMAIL_DOMAIN}` } },
  });
  await prisma.$disconnect();
});

describe("registration and login hardening", () => {
  test("passwords shorter than 8 characters are rejected", async () => {
    const res = await new Client().post("/api/auth/register", {
      name: "Short Password",
      email: emailFor("short"),
      password: "1234567",
      confirmPassword: "1234567",
    });
    assert.equal(res.status, 400);
    assert.ok(res.json.errors.password);
  });

  test("repeated failed logins for one email are locked out with 429", async () => {
    await registerUser("lockout");

    for (let i = 0; i < 5; i++) {
      const { res } = await login("lockout", "wrong-password");
      assert.equal(res.status, 401, `attempt ${i + 1}`);
    }

    // Even the correct password is refused while locked out
    const { res } = await login("lockout");
    assert.equal(res.status, 429);
    assert.ok(Number(res.headers.get("retry-after")) > 0);
    assert.match(res.json.message, /Terlalu banyak percobaan/);
  });

  test("unknown emails fail the same way as wrong passwords", async () => {
    const { res } = await login("does-not-exist");
    assert.equal(res.status, 401);
    assert.equal(res.json.message, "Email atau password yang Anda masukkan salah.");
  });

  test("a successful login clears earlier failures", async () => {
    await registerUser("recover");
    for (let i = 0; i < 4; i++) await login("recover", "wrong-password");
    assert.equal((await login("recover")).res.status, 200);
    for (let i = 0; i < 4; i++) await login("recover", "wrong-password");
    assert.equal((await login("recover")).res.status, 200);
  });
});

describe("profile", () => {
  test("name can be updated and is validated", async () => {
    const client = await registerUser("profile");

    const bad = await client.put("/api/account", { name: "x" });
    assert.equal(bad.status, 400);
    assert.ok(bad.json.errors.name);

    const ok = await client.put("/api/account", { name: "  Nama Baru  " });
    assert.equal(ok.status, 200);
    assert.equal(ok.json.data.user.name, "Nama Baru");

    const me = await client.get("/api/auth/me");
    assert.equal(me.json.data.user.name, "Nama Baru");
    assert.equal(me.json.data.user.email, emailFor("profile"));
  });
});

describe("password change", () => {
  test("wrong current password and weak new passwords are rejected", async () => {
    const client = await registerUser("pw-invalid");

    const wrong = await client.put("/api/account/password", {
      currentPassword: "not-my-password",
      newPassword: "NewPassword456!",
      confirmPassword: "NewPassword456!",
    });
    assert.equal(wrong.status, 400);
    assert.ok(wrong.json.errors.currentPassword);

    const weak = await client.put("/api/account/password", {
      currentPassword: PASSWORD,
      newPassword: "short",
      confirmPassword: "short",
    });
    assert.equal(weak.status, 400);
    assert.ok(weak.json.errors.newPassword);

    const mismatch = await client.put("/api/account/password", {
      currentPassword: PASSWORD,
      newPassword: "NewPassword456!",
      confirmPassword: "Different456!",
    });
    assert.equal(mismatch.status, 400);
    assert.ok(mismatch.json.errors.confirmPassword);

    // Nothing changed: the old password still works
    assert.equal((await login("pw-invalid")).res.status, 200);
  });

  test("changing the password signs out other sessions but keeps this one", async () => {
    const current = await registerUser("pw-change");
    const { client: other } = await login("pw-change");
    assert.equal((await other.get("/api/auth/me")).status, 200);

    const res = await current.put("/api/account/password", {
      currentPassword: PASSWORD,
      newPassword: "NewPassword456!",
      confirmPassword: "NewPassword456!",
    });
    assert.equal(res.status, 200, JSON.stringify(res.json));

    assert.equal((await current.get("/api/auth/me")).status, 200, "current session gets a fresh token");
    assert.equal((await other.get("/api/auth/me")).status, 401, "other session is revoked");
    assert.equal((await other.get("/api/transactions")).status, 401);

    assert.equal((await login("pw-change")).res.status, 401, "old password no longer works");
    assert.equal((await login("pw-change", "NewPassword456!")).res.status, 200);
  });

  test("current-password guesses are rate limited per user", async () => {
    const client = await registerUser("pw-limit");
    const body = { currentPassword: "guess", newPassword: "NewPassword456!", confirmPassword: "NewPassword456!" };
    for (let i = 0; i < 5; i++) {
      assert.equal((await client.put("/api/account/password", body)).status, 400, `attempt ${i + 1}`);
    }
    assert.equal((await client.put("/api/account/password", body)).status, 429);
  });
});

describe("sessions", () => {
  test("logout from all devices revokes every session", async () => {
    const first = await registerUser("logout-all");
    const { client: second } = await login("logout-all");

    const res = await first.delete("/api/account/sessions");
    assert.equal(res.status, 200);

    assert.equal((await first.get("/api/auth/me")).status, 401);
    assert.equal((await second.get("/api/auth/me")).status, 401);

    // A revoked token is also bounced from protected pages
    const page = await second.get("/settings");
    assert.equal(page.status, 307);

    // Logging in again works normally
    assert.equal((await login("logout-all")).res.status, 200);
  });

  test("a stolen token stays valid after plain logout only until revoked", async () => {
    const client = await registerUser("stolen");
    const stolen = new Client();
    stolen.cookie = client.cookie;

    await client.post("/api/auth/logout");
    assert.equal((await stolen.get("/api/auth/me")).status, 200, "plain logout only clears this browser's cookie");

    const { client: fresh } = await login("stolen");
    await fresh.delete("/api/account/sessions");
    assert.equal((await stolen.get("/api/auth/me")).status, 401);
  });
});

describe("account deletion", () => {
  test("requires the password and removes all user data", async () => {
    const client = await registerUser("delete-me");
    const categories = (await client.get("/api/categories")).json.data.categories;
    const food = categories.find((c) => c.type === "EXPENSE");

    const tx = await client.post("/api/transactions", {
      type: "EXPENSE",
      title: "Makan siang",
      amount: 25000,
      categoryId: food.id,
      date: "2026-10-01",
    });
    assert.equal(tx.status, 201);
    const budget = await client.post("/api/budgets", { categoryId: food.id, amount: 500000, month: 10, year: 2026 });
    assert.equal(budget.status, 201);

    const wrong = await client.delete("/api/account", { password: "wrong-password" });
    assert.equal(wrong.status, 400);
    assert.equal((await client.get("/api/auth/me")).status, 200, "still logged in after a failed attempt");

    const res = await client.delete("/api/account", { password: PASSWORD });
    assert.equal(res.status, 200, JSON.stringify(res.json));

    const user = await prisma.user.findUnique({ where: { email: emailFor("delete-me") } });
    assert.equal(user, null);
    const leftovers = await Promise.all([
      prisma.category.count({ where: { id: food.id } }),
      prisma.transaction.count({ where: { id: tx.json.data.transaction?.id ?? "" } }),
      prisma.budget.count({ where: { id: budget.json.data.budget.id } }),
    ]);
    assert.deepEqual(leftovers, [0, 0, 0]);

    assert.equal((await client.get("/api/auth/me")).status, 401);
    assert.equal((await login("delete-me")).res.status, 401);
  });
});

describe("access control", () => {
  test("account endpoints require a session", async () => {
    const anon = new Client();
    assert.equal((await anon.put("/api/account", { name: "Siapa" })).status, 401);
    assert.equal((await anon.delete("/api/account", { password: PASSWORD })).status, 401);
    assert.equal((await anon.put("/api/account/password", {})).status, 401);
    assert.equal((await anon.delete("/api/account/sessions")).status, 401);

    const page = await anon.get("/settings");
    assert.equal(page.status, 307);
    assert.match(page.headers.get("location"), /\/login\?redirect=%2Fsettings/);
  });

  test("pages send a Content-Security-Policy", async () => {
    const res = await new Client().get("/login");
    const csp = res.headers.get("content-security-policy");
    assert.ok(csp, "CSP header present");
    assert.match(csp, /frame-ancestors 'none'/);
    assert.match(csp, /object-src 'none'/);
  });
});
