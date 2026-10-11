import { NextResponse } from "next/server";
import { clearSessionCookie, getCurrentUser } from "@/lib/auth";
import { UNAUTHORIZED } from "@/lib/account";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/account/sessions
 * "Logout dari semua perangkat": revokes every session token of this user,
 * including the current one.
 */
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { sessionVersion: { increment: 1 } },
    });

    const response = NextResponse.json({
      success: true,
      message: "Anda telah keluar dari semua perangkat.",
    });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error("DELETE /api/account/sessions error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengakhiri sesi." },
      { status: 500 }
    );
  }
}
