/**
 * Small fixed-window rate limiter kept in process memory.
 *
 * Good enough for a single Node.js server (`npm start`, one container). With
 * several instances or serverless functions each instance counts on its own,
 * so the effective limit is multiplied; use a shared store (e.g. Redis) there.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitRule {
  /** Maximum hits allowed inside one window. */
  limit: number;
  windowMs: number;
}

export interface RateLimitStatus {
  limited: boolean;
  /** Seconds until the window resets (0 when not limited). */
  retryAfter: number;
}

const MAX_BUCKETS = 10_000;
const buckets = new Map<string, Bucket>();

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function liveBucket(key: string, now: number): Bucket | undefined {
  const bucket = buckets.get(key);
  if (bucket && bucket.resetAt <= now) {
    buckets.delete(key);
    return undefined;
  }
  return bucket;
}

/** Whether `key` has already used up its allowance, without counting a hit. */
export function checkRateLimit(key: string, rule: RateLimitRule, now = Date.now()): RateLimitStatus {
  const bucket = liveBucket(key, now);
  if (bucket && bucket.count >= rule.limit) {
    return { limited: true, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { limited: false, retryAfter: 0 };
}

/** Count one hit for `key`. */
export function hitRateLimit(key: string, rule: RateLimitRule, now = Date.now()): void {
  const bucket = liveBucket(key, now);
  if (bucket) {
    bucket.count += 1;
    return;
  }
  if (buckets.size >= MAX_BUCKETS) sweep(now);
  buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
}

/** Forget `key`, e.g. after a successful login. */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/** Test helper: drop every bucket. */
export function clearRateLimits(): void {
  buckets.clear();
}

const MINUTE = 60_000;

/** Failed logins for one email address (protects a single account). */
export const LOGIN_EMAIL_RULE: RateLimitRule = { limit: 5, windowMs: 15 * MINUTE };
/** Failed logins from one client IP across all emails (credential stuffing). */
export const LOGIN_IP_RULE: RateLimitRule = { limit: 50, windowMs: 15 * MINUTE };
/** New accounts from one client IP. */
export const REGISTER_IP_RULE: RateLimitRule = { limit: 50, windowMs: 60 * MINUTE };
/** Wrong current-password attempts on account settings, per user. */
export const ACCOUNT_PASSWORD_RULE: RateLimitRule = { limit: 5, windowMs: 15 * MINUTE };

/**
 * Best-effort client IP. `x-forwarded-for` is only trustworthy behind a reverse
 * proxy that sets it, which is why per-email limits are the primary defence.
 */
export function clientIp(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}

export function tooManyRequestsMessage(retryAfter: number): string {
  const minutes = Math.ceil(retryAfter / 60);
  return `Terlalu banyak percobaan. Silakan coba lagi dalam ${minutes} menit.`;
}
