import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getCurrentSession } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/jwt";

/**
 * GET /api/auth/session-expired?redirect=/path
 *
 * Pages redirect here when the session cookie is signed but no longer valid
 * (sessionVersion revoked, account deleted). The proxy only checks the
 * signature, so without clearing the cookie it would send /login straight back
 * to /dashboard and loop forever. Server Components cannot clear cookies, this
 * route handler can.
 *
 * A still-valid session is left untouched, so this link cannot be used to log
 * someone out from another site.
 */
export async function GET(request: NextRequest) {
  const target = safeRedirectPath(request.nextUrl.searchParams.get("redirect"));

  if (await getCurrentSession()) {
    return NextResponse.redirect(new URL(target, request.url));
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", target);
  const response = NextResponse.redirect(loginUrl);
  clearSessionCookie(response);
  return response;
}
