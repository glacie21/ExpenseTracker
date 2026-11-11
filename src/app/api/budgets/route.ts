import { NextRequest, NextResponse } from "next/server";
import { UNAUTHORIZED } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  duplicateBudgetResponse,
  getBudgetsWithProgress,
  parseBudgetBody,
  parseBudgetPeriod,
  serializeBudget,
} from "@/lib/budgets";
import { parseErrorResponse } from "@/lib/apiResponse";
import { isUniqueViolation } from "@/lib/dbErrors";

/**
 * GET /api/budgets?month=1-12&year=YYYY (default: bulan ini)
 * Daftar anggaran pengguna untuk bulan tersebut beserta pengeluaran aktual,
 * sisa anggaran, persentase penggunaan, dan status peringatan.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const period = parseBudgetPeriod(new URL(request.url).searchParams);
    if (!period.ok) {
      return NextResponse.json({ success: false, message: period.message }, { status: 400 });
    }

    const data = await getBudgetsWithProgress(user.id, period.year, period.month);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/budgets error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat anggaran." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/budgets  { categoryId, amount, month, year }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = await parseBudgetBody(body, user.id);
    if (!parsed.ok) return parseErrorResponse(parsed);

    const budget = await prisma.budget.create({
      data: { ...parsed.data, userId: user.id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Anggaran berhasil dibuat.",
        data: { budget: serializeBudget(budget) },
      },
      { status: 201 }
    );
  } catch (error) {
    if (isUniqueViolation(error)) return duplicateBudgetResponse();
    console.error("POST /api/budgets error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat anggaran." },
      { status: 500 }
    );
  }
}
