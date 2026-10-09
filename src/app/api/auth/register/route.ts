import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { validateRegisterInput } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateRegisterInput(body);

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

    const email = body.email.trim().toLowerCase();
    const name = body.name.trim();
    const password = body.password;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.",
          errors: { email: "Email sudah digunakan" },
        },
        { status: 409 }
      );
    }

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
      },
    });

    // Initialize default categories for new user
    const { ensureUserCategories } = await import("@/lib/categories");
    await ensureUserCategories(user.id);

    // Generate JWT token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // Prepare response with secure cookie
    const response = NextResponse.json(
      {
        success: true,
        message: "Pendaftaran berhasil! Mengalihkan ke dashboard...",
        data: { user },
      },
      { status: 201 }
    );

    const isProduction = process.env.NODE_ENV === "production";
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error) {
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
