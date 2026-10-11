import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, getJwtSecret, verifyToken } from "@/lib/jwt";
import { AuthSessionPayload, SafeUser } from "@/types";

export { AUTH_COOKIE_NAME, verifyToken };

/**
 * Hash plain text password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain text password with hashed password
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Valid bcrypt hash of a random string, compared against when the email does
// not exist so a failed login takes the same time either way (no user enumeration).
const DUMMY_PASSWORD_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.dGbZCwvrBmZr8ZcO0SLB9.TIHCqe";

export async function burnPasswordCheck(password: string): Promise<void> {
  await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
}

/**
 * Sign JWT session token
 */
export async function signToken(
  payload: AuthSessionPayload,
  rememberMe: boolean = false
): Promise<string> {
  const expirationTime = rememberMe ? "30d" : "1d";

  return new SignJWT({ ...payload, rm: rememberMe })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(getJwtSecret());
}

const SESSION_MAX_AGE = {
  remember: 60 * 60 * 24 * 30, // 30 days
  default: 60 * 60 * 24, // 1 day
};

/** Write the session cookie onto a route handler response. */
export function setSessionCookie(response: NextResponse, token: string, rememberMe: boolean = false) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: rememberMe ? SESSION_MAX_AGE.remember : SESSION_MAX_AGE.default,
  });
}

/** Expire the session cookie on a route handler response. */
export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/** Sign a session token for a user, bound to their current sessionVersion. */
export function createSessionToken(
  user: { id: string; email: string; name: string; sessionVersion: number },
  rememberMe: boolean = false
): Promise<string> {
  return signToken({ userId: user.id, email: user.email, name: user.name, sv: user.sessionVersion }, rememberMe);
}

export interface CurrentSession {
  user: SafeUser;
  rememberMe: boolean;
}

/**
 * Retrieve current logged-in user from request cookies (Server Component / Server Action context)
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

/**
 * Current user plus session details. A token whose sessionVersion no longer
 * matches the database (password changed, "logout all devices") is rejected.
 */
export async function getCurrentSession(): Promise<CurrentSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);
    if (!payload?.userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        sessionVersion: true,
      },
    });

    // Tokens issued before sessionVersion existed carry no "sv" and count as 0
    if (!user || user.sessionVersion !== (payload.sv ?? 0)) {
      return null;
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      rememberMe: payload.rm === true,
    };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      (error as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("Failed to get current session:", error);
    return null;
  }
}
