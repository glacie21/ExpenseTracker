import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { burnPasswordCheck, comparePassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { validateLoginInput } from "@/lib/validations";
import {
  checkRateLimit,
  clientIp,
  hitRateLimit,
  loginRules,
  releaseRateLimit,
  resetRateLimit,
  tooManyRequestsMessage,
} from "@/lib/rateLimit";

const INVALID_CREDENTIALS = {
  success: false,
  message: "Email atau password yang Anda masukkan salah.",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const validation = validateLoginInput(body ?? {});

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Data input tidak valid",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const email = String(body.email).trim().toLowerCase();
    const password = body.password;
    const rememberMe = Boolean(body.rememberMe);

    // Lock out before checking the password, so a correct guess is not revealed either
    const rules = loginRules(email, clientIp(request.headers));
    const blocked = rules
      .map(({ key, rule }) => checkRateLimit(key, rule))
      .find((status) => status.limited);
    if (blocked) {
      return NextResponse.json(
        { success: false, message: tooManyRequestsMessage(blocked.retryAfter) },
        { status: 429, headers: { "Retry-After": String(blocked.retryAfter) } }
      );
    }

    // Count the attempt before the slow password check, so a burst of parallel
    // requests cannot all slip past the check above; a valid login gives it back
    for (const { key, rule } of rules) hitRateLimit(key, rule);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Same bcrypt cost whether or not the email exists
    const isPasswordValid = user
      ? await comparePassword(password, user.password)
      : (await burnPasswordCheck(password), false);

    if (!user || !isPasswordValid) {
      return NextResponse.json(INVALID_CREDENTIALS, { status: 401 });
    }

    // The first rule is the account's own lockout. The owner proved the password:
    // forget those failures, and give back this attempt on the shared counters
    // without wiping hits from other attempts
    const [strictest, ...others] = rules;
    resetRateLimit(strictest.key);
    for (const { key } of others) releaseRateLimit(key);

    const token = await createSessionToken(user, rememberMe);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil! Selamat datang kembali.",
      data: { user: safeUser },
    });

    setSessionCookie(response, token, rememberMe);

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan internal pada server. Silakan coba beberapa saat lagi.",
      },
      { status: 500 }
    );
  }
}
