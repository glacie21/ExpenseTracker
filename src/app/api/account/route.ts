import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getCurrentUser } from "@/lib/auth";
import { UNAUTHORIZED, verifyCurrentPassword } from "@/lib/account";
import { isUnsupportedCharacterError, unsupportedCharacterResponse } from "@/lib/dbErrors";
import { prisma } from "@/lib/prisma";
import { nameError } from "@/lib/validations";

/**
 * PUT /api/account  { name }
 * Update the profile of the logged-in user. Email stays fixed (it is the login).
 */
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const problem = nameError(name);
    if (problem) {
      return NextResponse.json(
        { success: false, message: "Data input tidak valid", errors: { name: problem } },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: { name },
      select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json({
      success: true,
      message: "Profil berhasil diperbarui.",
      data: { user },
    });
  } catch (error) {
    if (isUnsupportedCharacterError(error)) return unsupportedCharacterResponse();
    console.error("PUT /api/account error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui profil." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/account  { password }
 * Permanently delete the account and all of its data, then end the session.
 */
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const check = await verifyCurrentPassword(currentUser.id, body?.password, "password");
    if (!check.ok) return check.response;

    // Children first: categories are referenced by transactions and budgets with RESTRICT
    await prisma.$transaction([
      prisma.budget.deleteMany({ where: { userId: currentUser.id } }),
      prisma.transaction.deleteMany({ where: { userId: currentUser.id } }),
      prisma.category.deleteMany({ where: { userId: currentUser.id } }),
      prisma.user.delete({ where: { id: currentUser.id } }),
    ]);

    const response = NextResponse.json({
      success: true,
      message: "Akun dan seluruh data Anda telah dihapus.",
    });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error("DELETE /api/account error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus akun." },
      { status: 500 }
    );
  }
}
