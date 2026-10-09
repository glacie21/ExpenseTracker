import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "expense_tracker_session";
const JWT_SECRET_STRING =
  process.env.JWT_SECRET || "default_expense_tracker_dev_secret_key_32_chars_min";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

async function isTokenValid(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return Boolean(payload?.userId);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authenticated = await isTokenValid(token);

  const isProtectedPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/transactions") ||
    pathname.startsWith("/categories");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // If user is trying to access protected route without authentication
  if (isProtectedPath && !authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is already logged in and tries to access login or register page
  if (isAuthPage && authenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/categories/:path*",
    "/login",
    "/register",
  ],
};
