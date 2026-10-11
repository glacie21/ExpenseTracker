import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, getCurrentSession, hashPassword, setSessionCookie } from "@/lib/auth";
import { UNAUTHORIZED, verifyCurrentPassword } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { validatePasswordChangeInput } from "@/lib/validations";

/**
 * PUT /api/account/password  { currentPassword, newPassword, confirmPassword }
 * Change the password. Every other session is signed out; this one gets a new token.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const validation = validatePasswordChangeInput(body ?? {});
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: "Data input tidak valid", errors: validation.errors },
        { status: 400 }
      );
    }

    const check = await verifyCurrentPassword(session.user.id, body.currentPassword, "currentPassword");
    if (!check.ok) return check.response;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: await hashPassword(body.newPassword),
        sessionVersion: { increment: 1 },
      },
      select: { id: true, name: true, email: true, sessionVersion: true },
    });

    const response = NextResponse.json({
      success: true,
      message: "Password berhasil diubah. Sesi di perangkat lain telah diakhiri.",
    });
    setSessionCookie(response, await createSessionToken(user, session.rememberMe), session.rememberMe);
    return response;
  } catch (error) {
    console.error("PUT /api/account/password error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengubah password." },
      { status: 500 }
    );
  }
}
