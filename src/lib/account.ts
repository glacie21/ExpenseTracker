import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/auth";
import {
  ACCOUNT_PASSWORD_RULE,
  checkRateLimit,
  hitRateLimit,
  resetRateLimit,
} from "@/lib/rateLimit";
import { tooManyRequestsResponse, unauthorizedResponse, validationErrorResponse } from "@/lib/apiResponse";

type PasswordCheck = { ok: true } | { ok: false; response: NextResponse };

/**
 * Re-authenticate a logged-in user before a sensitive change (new password,
 * account deletion). Wrong guesses are rate limited per user, so a stolen
 * session cannot be used to brute-force the password.
 */
export async function verifyCurrentPassword(
  userId: string,
  password: unknown,
  field: string
): Promise<PasswordCheck> {
  const key = `account:password:${userId}`;
  const limit = checkRateLimit(key, ACCOUNT_PASSWORD_RULE);
  if (limit.limited) {
    return { ok: false, response: tooManyRequestsResponse(limit.retryAfter) };
  }

  // Counted before the password is compared so parallel guesses cannot all pass
  hitRateLimit(key, ACCOUNT_PASSWORD_RULE);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
  if (!user) {
    return { ok: false, response: unauthorizedResponse() };
  }

  const valid = typeof password === "string" && password !== "" && (await comparePassword(password, user.password));
  if (!valid) {
    return {
      ok: false,
      response: validationErrorResponse({ [field]: "Password saat ini salah" }, "Password saat ini salah."),
    };
  }

  resetRateLimit(key);
  return { ok: true };
}
