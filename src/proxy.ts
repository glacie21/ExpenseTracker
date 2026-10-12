import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, REQUEST_PATH_HEADER, verifyToken } from "@/lib/jwt";

const PROTECTED_PREFIXES = ["/dashboard", "/transactions", "/categories", "/reports", "/budgets", "/settings"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authenticated = Boolean(await verifyToken(token));

  const isProtectedPath = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // If user is trying to access protected route without authentication
  if (isProtectedPath && !authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // If user is already logged in and tries to access login or register page
  if (isAuthPage && authenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtectedPath) {
    // Lets the dashboard layout send a revoked session back here after login.
    // Always overwritten, so a client-supplied value never reaches the layout.
    const params = new URLSearchParams(search);
    params.delete("_rsc");
    const query = params.toString();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(REQUEST_PATH_HEADER, query ? `${pathname}?${query}` : pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/categories/:path*",
    "/reports/:path*",
    "/budgets/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
