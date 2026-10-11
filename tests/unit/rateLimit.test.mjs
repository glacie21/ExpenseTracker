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
  resetRateLimit,
  tooManyRequestsMessage,
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

test("client IP prefers x-real-ip, then the first x-forwarded-for entry", () => {
  assert.equal(clientIp(new Headers({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" })), "1.1.1.1");
  assert.equal(clientIp(new Headers({ "x-forwarded-for": " 3.3.3.3 , 10.0.0.1" })), "3.3.3.3");
  assert.equal(clientIp(new Headers()), "unknown");
});

test("message rounds the wait up to whole minutes", () => {
  assert.match(tooManyRequestsMessage(61), /2 menit/);
  assert.match(tooManyRequestsMessage(1), /1 menit/);
});
