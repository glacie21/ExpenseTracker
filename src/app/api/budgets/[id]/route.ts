import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { duplicateBudgetResponse, parseBudgetBody } from "@/lib/budgets";
import { parseErrorResponse, unauthorizedResponse } from "@/lib/apiResponse";
import { isRecordNotFound, isUniqueViolation } from "@/lib/dbErrors";
import { routeId } from "@/lib/validations";
import { serializeAmount } from "@/lib/money";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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
      return unauthorizedResponse();
    }

    const id = await routeId(params);
    if (!id) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }

    // Ownership and body checks run together; "not found" still wins over a bad body
    const body = await request.json().catch(() => null);
    const [existing, parsed] = await Promise.all([
      prisma.budget.findFirst({ where: { id, userId: user.id }, select: { id: true } }),
      parseBudgetBody(body, user.id),
    ]);
    if (!existing) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }
    if (!parsed.ok) return parseErrorResponse(parsed);

    // Scoped by userId so the ownership check is part of the write; returns the updated row
    const budget = await prisma.budget.update({ where: { id, userId: user.id }, data: parsed.data });
    return NextResponse.json({
      success: true,
      message: "Anggaran berhasil diperbarui.",
      data: { budget: serializeAmount(budget) },
    });
  } catch (error) {
    if (isUniqueViolation(error)) return duplicateBudgetResponse();
    // Deleted between the check and the update
    if (isRecordNotFound(error)) return NextResponse.json(NOT_FOUND, { status: 404 });
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
      return unauthorizedResponse();
    }

    const id = await routeId(params);
    if (!id) {
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
