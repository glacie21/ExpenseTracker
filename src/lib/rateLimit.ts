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

/** Give back one hit counted by `hitRateLimit`, e.g. once an attempt turns out to be valid. */
export function releaseRateLimit(key: string, now = Date.now()): void {
  const bucket = liveBucket(key, now);
  if (!bucket) return;
  bucket.count -= 1;
  if (bucket.count <= 0) buckets.delete(key);
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

/**
 * Failed logins for one email address from one client IP. Keyed per IP so a
 * stranger cannot lock the owner out by guessing wrong on purpose.
 */
export const LOGIN_EMAIL_IP_RULE: RateLimitRule = { limit: 5, windowMs: 15 * MINUTE };
/**
 * Failed logins for one email address from any IP (guessing spread over many
 * IPs). Also the only per-email limit when the client IP is unknown, so it
 * falls back to the strict 5 there; see loginRules().
 */
export const LOGIN_EMAIL_RULE: RateLimitRule = { limit: 20, windowMs: 15 * MINUTE };
/** Failed logins from one client IP across all emails (credential stuffing). */
export const LOGIN_IP_RULE: RateLimitRule = { limit: 50, windowMs: 15 * MINUTE };
/** New accounts from one client IP. */
export const REGISTER_IP_RULE: RateLimitRule = { limit: 50, windowMs: 60 * MINUTE };
/**
 * Registrations refused because the email is taken, per client IP. Each one
 * tells the caller that the address has an account, so this caps how fast
 * a list of emails can be checked.
 */
export const REGISTER_TAKEN_RULE: RateLimitRule = { limit: 10, windowMs: 60 * MINUTE };
/** Wrong current-password attempts on account settings, per user. */
export const ACCOUNT_PASSWORD_RULE: RateLimitRule = { limit: 5, windowMs: 15 * MINUTE };

/**
 * How many reverse proxies in front of the app append to `x-forwarded-for`.
 * TRUST_PROXY: unset/"false" = 0, "true" = 1, or a number. On Vercel it
 * defaults to 1. Without a trusted proxy the header is written by the client
 * itself, so it is ignored.
 */
export function trustedProxyHops(env: Record<string, string | undefined> = process.env): number {
  const value = env.TRUST_PROXY?.trim().toLowerCase();
  if (!value) return env.VERCEL ? 1 : 0;
  if (value === "true") return 1;
  const hops = Number(value);
  return Number.isInteger(hops) && hops > 0 ? hops : 0;
}

/**
 * The client IP as seen by the closest trusted proxy, or null when it cannot
 * be known. Each proxy appends the address it received the request from, so
 * the real client is `hops` entries from the end; anything further left was
 * sent by the client and may be forged. `x-real-ip` is never read: whether
 * it was set by a proxy or by the client cannot be told apart.
 */
export function clientIp(headers: Headers, hops: number = trustedProxyHops()): string | null {
  if (hops < 1) return null;
  const entries = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return entries[entries.length - hops] ?? null;
}

/**
 * Rate limit keys and rules for one login attempt.
 * With a known IP: per email+IP (strict), per email (looser), per IP.
 * Without one, every client shares a single IP, so per-IP limits would let
 * one person lock everybody out; only a strict per-email limit is used.
 */
export function loginRules(email: string, ip: string | null): { key: string; rule: RateLimitRule }[] {
  if (!ip) return [{ key: `login:email:${email}`, rule: LOGIN_EMAIL_IP_RULE }];
  return [
    { key: `login:email-ip:${email}|${ip}`, rule: LOGIN_EMAIL_IP_RULE },
    { key: `login:email:${email}`, rule: LOGIN_EMAIL_RULE },
    { key: `login:ip:${ip}`, rule: LOGIN_IP_RULE },
  ];
}

export function tooManyRequestsMessage(retryAfter: number): string {
  const minutes = Math.ceil(retryAfter / 60);
  return `Terlalu banyak percobaan. Silakan coba lagi dalam ${minutes} menit.`;
}
