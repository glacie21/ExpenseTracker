import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/auth";
import {
  ACCOUNT_PASSWORD_RULE,
  checkRateLimit,
  hitRateLimit,
  resetRateLimit,
  tooManyRequestsMessage,
} from "@/lib/rateLimit";

export const UNAUTHORIZED = {
  success: false,
  message: "Akses ditolak. Sesi tidak valid atau telah berakhir.",
};

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
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: tooManyRequestsMessage(limit.retryAfter) },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      ),
    };
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
  if (!user) {
    return { ok: false, response: NextResponse.json(UNAUTHORIZED, { status: 401 }) };
  }

  const valid = typeof password === "string" && password !== "" && (await comparePassword(password, user.password));
  if (!valid) {
    hitRateLimit(key, ACCOUNT_PASSWORD_RULE);
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Password saat ini salah.",
          errors: { [field]: "Password saat ini salah" },
        },
        { status: 400 }
      ),
    };
  }

  resetRateLimit(key);
  return { ok: true };
}
