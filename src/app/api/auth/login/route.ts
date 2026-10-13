import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { burnPasswordCheck, comparePassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { validateLoginInput } from "@/lib/validations";
import {
  LOGIN_EMAIL_RULE,
  LOGIN_IP_RULE,
  checkRateLimit,
  clientIp,
  hitRateLimit,
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
    const emailKey = `login:email:${email}`;
    const ipKey = `login:ip:${clientIp(request.headers)}`;
    const blocked = [checkRateLimit(emailKey, LOGIN_EMAIL_RULE), checkRateLimit(ipKey, LOGIN_IP_RULE)].find(
      (status) => status.limited
    );
    if (blocked) {
      return NextResponse.json(
        { success: false, message: tooManyRequestsMessage(blocked.retryAfter) },
        { status: 429, headers: { "Retry-After": String(blocked.retryAfter) } }
      );
    }

    // Count the attempt before the slow password check, so a burst of parallel
    // requests cannot all slip past the check above; a valid login gives it back
    hitRateLimit(emailKey, LOGIN_EMAIL_RULE);
    hitRateLimit(ipKey, LOGIN_IP_RULE);

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

    resetRateLimit(emailKey);
    releaseRateLimit(ipKey);

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
