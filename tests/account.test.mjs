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
  /** `headers` are sent with every request, e.g. an x-forwarded-for IP. */
  constructor(headers = {}) {
    this.cookie = "";
    this.headers = headers;
  }

  async request(method, path, body) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      redirect: "manual",
      headers: {
        ...this.headers,
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

/**
 * Follow redirects by hand (keeping cookies) and return where they end.
 * Fails instead of hanging when the chain loops.
 */
async function followRedirects(client, path, maxHops = 5) {
  let current = path;
  for (let hop = 0; hop <= maxHops; hop++) {
    const res = await client.get(current);
    const location = res.headers.get("location");
    if (res.status < 300 || res.status >= 400 || !location) {
      return { status: res.status, path: current };
    }
    const next = new URL(location, BASE_URL);
    current = next.pathname + next.search;
  }
  assert.fail(`redirect loop starting at ${path}`);
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

// Each test gets its own client IP, so it does not fill the shared bucket
let ipCounter = 0;
const freshIp = () => `198.51.${Math.floor(Math.random() * 250)}.${++ipCounter % 250}`;

describe("rate limits per client IP", () => {
  test("register cannot be used to check which emails have an account", async () => {
    await registerUser("enum-target");
    const client = new Client({ "X-Forwarded-For": freshIp() });
    const body = { name: "Pengintai", email: emailFor("enum-target"), password: PASSWORD, confirmPassword: PASSWORD };

    for (let i = 0; i < 10; i++) {
      assert.equal((await client.post("/api/auth/register", body)).status, 409, `attempt ${i + 1}`);
    }
    // Further checks are refused, whether or not the email is taken
    const taken = await client.post("/api/auth/register", body);
    assert.equal(taken.status, 429);
    assert.ok(Number(taken.headers.get("retry-after")) > 0);
    const free = await client.post("/api/auth/register", { ...body, email: emailFor("enum-free") });
    assert.equal(free.status, 429);
  });

});

describe("input and race hardening", () => {
  test("parallel wrong guesses cannot get past the lockout", async () => {
    await registerUser("burst");
    const results = await Promise.all(Array.from({ length: 10 }, () => login("burst", "wrong-password")));
    const statuses = results.map(({ res }) => res.status);
    assert.ok(statuses.filter((s) => s === 401).length <= 5, `statuses: ${statuses}`);
    assert.ok(statuses.every((s) => s === 401 || s === 429), `statuses: ${statuses}`);
  });

  test("non-string credentials are a 400, not a server error", async () => {
    const loginRes = await new Client().post("/api/auth/login", { email: emailFor("nonstring"), password: 12345678 });
    assert.equal(loginRes.status, 400);
    const emailRes = await new Client().post("/api/auth/login", { email: 1, password: PASSWORD });
    assert.equal(emailRes.status, 400);
    const registerRes = await new Client().post("/api/auth/register", {
      name: "Angka",
      email: emailFor("nonstring"),
      password: 12345678,
      confirmPassword: 12345678,
    });
    assert.equal(registerRes.status, 400);
  });

  test("two registrations with one email at once: one wins, the other gets 409", async () => {
    const body = { name: "Kembar", email: emailFor("twin"), password: PASSWORD, confirmPassword: PASSWORD };
    const results = await Promise.all([new Client().post("/api/auth/register", body), new Client().post("/api/auth/register", body)]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  });

  test("two identical category creates at once: one wins, the other gets 409", async () => {
    const client = await registerUser("cat-race");
    const body = { name: "Balapan", type: "EXPENSE" };
    const results = await Promise.all([client.post("/api/categories", body), client.post("/api/categories", body)]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  });

  test("deleting every category does not bring the defaults back", async () => {
    const client = await registerUser("no-cats");
    const { categories } = (await client.get("/api/categories")).json.data;
    assert.equal(categories.length, 13);
    for (const c of categories) assert.equal((await client.delete(`/api/categories/${c.id}`)).status, 200);
    assert.equal((await client.get("/api/categories")).json.data.categories.length, 0);
  });

  test("an absurd page number returns an empty page", async () => {
    const client = await registerUser("paging");
    const res = await client.get("/api/transactions?page=99999999999999999999&limit=100");
    assert.equal(res.status, 200);
    assert.equal(res.json.data.transactions.length, 0);
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

  test("a revoked session lands on the login page instead of a redirect loop", async () => {
    const first = await registerUser("revoked-loop");
    const { client: second } = await login("revoked-loop");
    await first.delete("/api/account/sessions");

    const dashboard = await followRedirects(second, "/dashboard");
    assert.equal(dashboard.path, "/login?redirect=%2Fdashboard");
    assert.equal(dashboard.status, 200);

    // The stale cookie was cleared, so the login page stays put on a reload
    assert.equal((await second.get("/login")).status, 200);

    // Same for the settings page, which checks the session on its own
    const { client: stale } = await login("revoked-loop");
    const { client: revoker } = await login("revoked-loop");
    await revoker.delete("/api/account/sessions");
    const settings = await followRedirects(stale, "/settings");
    assert.equal(settings.path, "/login?redirect=%2Fsettings");
    assert.equal(settings.status, 200);
  });

  test("a deleted account's other sessions land on the login page", async () => {
    const first = await registerUser("deleted-loop");
    const { client: second } = await login("deleted-loop");
    assert.equal((await first.delete("/api/account", { password: PASSWORD })).status, 200);

    // The requested page, query included, is kept for after the next login
    const result = await followRedirects(second, "/transactions?type=EXPENSE");
    assert.equal(result.status, 200);
    assert.equal(result.path, "/login?redirect=%2Ftransactions%3Ftype%3DEXPENSE");
  });

  test("the session-expired route leaves a valid session alone", async () => {
    const client = await registerUser("still-valid");

    const res = await client.get("/api/auth/session-expired?redirect=/budgets");
    assert.equal(res.status, 307);
    assert.equal(new URL(res.headers.get("location")).pathname, "/budgets");
    assert.equal((await client.get("/api/auth/me")).status, 200, "a cross-site link must not log the user out");

    // Off-site redirect targets are ignored
    const offsite = await client.get("/api/auth/session-expired?redirect=//evil.example");
    assert.equal(new URL(offsite.headers.get("location")).pathname, "/dashboard");
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
