import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";
import { validateRegisterInput } from "@/lib/validations";
import { isUniqueViolation } from "@/lib/dbErrors";
import {
  REGISTER_IP_RULE,
  REGISTER_TAKEN_RULE,
  checkRateLimit,
  clientIp,
  hitRateLimit,
  releaseRateLimit,
  tooManyRequestsMessage,
} from "@/lib/rateLimit";

function emailTakenResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.",
      errors: { email: "Email sudah digunakan" },
    },
    { status: 409 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request.headers);
    const ipKey = `register:ip:${ip}`;
    const takenKey = `register:taken:${ip}`;
    const limit = [checkRateLimit(ipKey, REGISTER_IP_RULE), checkRateLimit(takenKey, REGISTER_TAKEN_RULE)].find(
      (status) => status.limited
    );
    if (limit) {
      return NextResponse.json(
        { success: false, message: tooManyRequestsMessage(limit.retryAfter) },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    const body = await request.json().catch(() => null);
    const validation = validateRegisterInput(body ?? {});

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
    const name = String(body.name).trim();
    const password = body.password;

    // A 409 reveals that the email has an account, so every lookup counts
    // until the account is actually created. Counted before the lookup, so a
    // burst of parallel requests cannot all get an answer.
    hitRateLimit(takenKey, REGISTER_TAKEN_RULE);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) return emailTakenResponse();

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        sessionVersion: true,
      },
    });
    hitRateLimit(ipKey, REGISTER_IP_RULE);
    releaseRateLimit(takenKey);

    // Initialize default categories for new user
    const { ensureUserCategories } = await import("@/lib/categories");
    await ensureUserCategories(user.id);

    const token = await createSessionToken(user);
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Prepare response with secure cookie
    const response = NextResponse.json(
      {
        success: true,
        message: "Pendaftaran berhasil! Mengalihkan ke dashboard...",
        data: { user: safeUser },
      },
      { status: 201 }
    );

    setSessionCookie(response, token);

    return response;
  } catch (error) {
    if (isUniqueViolation(error)) return emailTakenResponse();
    console.error("Register API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan internal pada server. Silakan coba beberapa saat lagi.",
      },
      { status: 500 }
    );
  }
}
