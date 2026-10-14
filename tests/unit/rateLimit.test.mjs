/**
 * Unit tests for the in-memory rate limiter (src/lib/rateLimit.ts).
 */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  checkRateLimit,
  clearRateLimits,
  clientIp,
  hitRateLimit,
  loginRules,
  releaseRateLimit,
  resetRateLimit,
  tooManyRequestsMessage,
  trustedProxyHops,
} from "../../src/lib/rateLimit.ts";

const RULE = { limit: 3, windowMs: 60_000 };
const T0 = 1_000_000;

beforeEach(() => clearRateLimits());

test("allows hits up to the limit, then blocks", () => {
  for (let i = 0; i < 3; i++) {
    assert.equal(checkRateLimit("k", RULE, T0).limited, false);
    hitRateLimit("k", RULE, T0);
  }
  const status = checkRateLimit("k", RULE, T0 + 1_000);
  assert.equal(status.limited, true);
  assert.equal(status.retryAfter, 59);
});

test("the window resets after windowMs", () => {
  for (let i = 0; i < 3; i++) hitRateLimit("k", RULE, T0);
  assert.equal(checkRateLimit("k", RULE, T0 + 59_999).limited, true);
  assert.equal(checkRateLimit("k", RULE, T0 + 60_000).limited, false);

  // A fresh window starts counting from one again
  hitRateLimit("k", RULE, T0 + 60_000);
  assert.equal(checkRateLimit("k", RULE, T0 + 60_000).limited, false);
});

test("keys are independent and can be reset", () => {
  for (let i = 0; i < 3; i++) hitRateLimit("a", RULE, T0);
  assert.equal(checkRateLimit("a", RULE, T0).limited, true);
  assert.equal(checkRateLimit("b", RULE, T0).limited, false);

  resetRateLimit("a");
  assert.equal(checkRateLimit("a", RULE, T0).limited, false);
});

test("retryAfter is at least one second", () => {
  for (let i = 0; i < 3; i++) hitRateLimit("k", RULE, T0);
  assert.equal(checkRateLimit("k", RULE, T0 + 59_999).retryAfter, 1);
});

test("without a trusted proxy, client-sent IP headers are ignored", () => {
  const spoofed = new Headers({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" });
  assert.equal(clientIp(spoofed, 0), null);
  assert.equal(clientIp(new Headers(), 1), null);
});

test("behind trusted proxies, the client is that many entries from the end", () => {
  // The client forged "6.6.6.6"; each proxy appended the address it really saw
  const headers = new Headers({ "x-forwarded-for": "6.6.6.6, 3.3.3.3 , 10.0.0.1" });
  assert.equal(clientIp(headers, 1), "10.0.0.1");
  assert.equal(clientIp(headers, 2), "3.3.3.3");
  // x-real-ip may come from the client, so it never decides the IP
  assert.equal(clientIp(new Headers({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "4.4.4.4" }), 1), "4.4.4.4");
  // Fewer entries than hops: the request did not pass all proxies
  assert.equal(clientIp(new Headers({ "x-forwarded-for": "4.4.4.4" }), 2), null);
});

test("TRUST_PROXY sets the number of trusted proxies", () => {
  assert.equal(trustedProxyHops({}), 0);
  assert.equal(trustedProxyHops({ TRUST_PROXY: "false" }), 0);
  assert.equal(trustedProxyHops({ TRUST_PROXY: "true" }), 1);
  assert.equal(trustedProxyHops({ TRUST_PROXY: "2" }), 2);
  assert.equal(trustedProxyHops({ TRUST_PROXY: "-1" }), 0);
  assert.equal(trustedProxyHops({ VERCEL: "1" }), 1);
  assert.equal(trustedProxyHops({ VERCEL: "1", TRUST_PROXY: "false" }), 0);
});

const isLimited = (rules) => rules.some(({ key, rule }) => checkRateLimit(key, rule, T0).limited);

test("login lockout is per email and IP, so others cannot lock the owner out", () => {
  const attacker = loginRules("owner@example.com", "6.6.6.6");
  for (let i = 0; i < 5; i++) {
    for (const { key, rule } of attacker) hitRateLimit(key, rule, T0);
  }
  assert.equal(isLimited(attacker), true);
  assert.equal(isLimited(loginRules("owner@example.com", "1.1.1.1")), false);
});

test("guesses spread over many IPs still hit the per-email limit", () => {
  for (let i = 0; i < 20; i++) {
    for (const { key, rule } of loginRules("owner@example.com", "9.9.9." + i)) hitRateLimit(key, rule, T0);
  }
  assert.equal(isLimited(loginRules("owner@example.com", "1.1.1.1")), true);
});

test("with an unknown IP, only a strict per-email limit applies", () => {
  const rules = loginRules("owner@example.com", null);
  assert.equal(rules.length, 1, "no shared per-IP bucket that everyone could be locked out of");
  assert.equal(rules[0].rule.limit, 5);
});

test("message rounds the wait up to whole minutes", () => {
  assert.match(tooManyRequestsMessage(61), /2 menit/);
  assert.match(tooManyRequestsMessage(1), /1 menit/);
});

test("a released hit no longer counts toward the limit", () => {
  for (let i = 0; i < 3; i++) hitRateLimit("k", RULE, T0);
  assert.equal(checkRateLimit("k", RULE, T0).limited, true);
  releaseRateLimit("k", T0);
  assert.equal(checkRateLimit("k", RULE, T0).limited, false);
  // Releasing more than was counted never goes below an empty bucket
  for (let i = 0; i < 5; i++) releaseRateLimit("k", T0);
  for (let i = 0; i < 2; i++) hitRateLimit("k", RULE, T0);
  assert.equal(checkRateLimit("k", RULE, T0).limited, false);
});
