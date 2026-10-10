import { jwtVerify } from "jose";
import { AuthSessionPayload } from "@/types";

/**
 * Edge-safe session primitives shared by `proxy.ts` and server code.
 * Must not import Prisma or `next/headers`.
 */
export const AUTH_COOKIE_NAME = "expense_tracker_session";

const JWT_SECRET_STRING = process.env.JWT_SECRET;

if (!JWT_SECRET_STRING && process.env.NODE_ENV === "production") {
  console.warn("[auth] JWT_SECRET is not set. Using an insecure development fallback.");
}

export const JWT_SECRET = new TextEncoder().encode(
  JWT_SECRET_STRING || "default_expense_tracker_dev_secret_key_32_chars_min"
);

/**
 * Verify JWT token string
 */
export async function verifyToken(token: string | undefined): Promise<AuthSessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
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
