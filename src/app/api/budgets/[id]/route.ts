import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DUPLICATE_BUDGET_MESSAGE, parseBudgetBody } from "@/lib/budgets";
import { isUniqueViolation } from "@/lib/dbErrors";
import { isValidId } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const UNAUTHORIZED = {
  success: false,
  message: "Akses ditolak. Sesi tidak valid atau telah berakhir.",
};

// Same response for "does not exist" and "belongs to another user"
const NOT_FOUND = {
  success: false,
  message: "Anggaran tidak ditemukan atau Anda tidak memiliki akses.",
};

/**
 * PUT /api/budgets/[id]  { categoryId, amount, month, year }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }

    const existing = await prisma.budget.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = await parseBudgetBody(body, user.id);
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, message: parsed.message, errors: parsed.errors },
        { status: parsed.status }
      );
    }

    // Scoped by userId so the ownership check is part of the write
    const result = await prisma.budget.updateMany({
      where: { id, userId: user.id },
      data: parsed.data,
    });
    if (result.count === 0) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }

    const budget = await prisma.budget.findFirstOrThrow({ where: { id, userId: user.id } });
    return NextResponse.json({
      success: true,
      message: "Anggaran berhasil diperbarui.",
      data: { budget: { ...budget, amount: budget.amount.toNumber() } },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { success: false, message: DUPLICATE_BUDGET_MESSAGE, errors: { categoryId: "Anggaran sudah ada" } },
        { status: 409 }
      );
    }
    console.error("PUT /api/budgets/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui anggaran." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/budgets/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }

    const result = await prisma.budget.deleteMany({ where: { id, userId: user.id } });
    if (result.count === 0) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Anggaran berhasil dihapus." });
  } catch (error) {
    console.error("DELETE /api/budgets/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus anggaran." },
      { status: 500 }
    );
  }
}
