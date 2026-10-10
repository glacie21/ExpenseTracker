import { jwtVerify } from "jose";
import { AuthSessionPayload } from "@/types";

/**
 * Edge-safe session primitives shared by `proxy.ts` and server code.
 * Must not import Prisma or `next/headers`.
 */
export const AUTH_COOKIE_NAME = "expense_tracker_session";

const DEV_FALLBACK_SECRET = "default_expense_tracker_dev_secret_key_32_chars_min";
const MIN_SECRET_LENGTH = 32;

let cachedSecret: Uint8Array | null = null;

/**
 * Signing key from JWT_SECRET. In production a missing or short secret is a
 * hard error (checked on first use, so `next build` does not need it);
 * development falls back to a fixed, insecure key.
 */
export function getJwtSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`JWT_SECRET must be set to at least ${MIN_SECRET_LENGTH} characters in production.`);
    }
    if (!secret) console.warn("[auth] JWT_SECRET is not set. Using an insecure development fallback.");
  }
  cachedSecret = new TextEncoder().encode(secret || DEV_FALLBACK_SECRET);
  return cachedSecret;
}

/**
 * Verify JWT token string
 */
export async function verifyToken(token: string | undefined): Promise<AuthSessionPayload | null> {
  if (!token) return null;
  const secret = getJwtSecret(); // misconfiguration must surface, not look like "logged out"
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.userId !== "string") return null;
    return payload as unknown as AuthSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Only allow same-origin relative paths as post-login redirect targets.
 */
export function safeRedirectPath(path: string | null | undefined, fallback = "/dashboard"): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return fallback;
  }
  return path;
}
