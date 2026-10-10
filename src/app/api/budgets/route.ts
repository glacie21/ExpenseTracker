import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DUPLICATE_BUDGET_MESSAGE,
  currentMonthYear,
  getBudgetsWithProgress,
  isDuplicateBudgetError,
  parseBudgetBody,
} from "@/lib/budgets";
import { BUDGET_MAX_YEAR, BUDGET_MIN_YEAR } from "@/lib/validations";

const UNAUTHORIZED = {
  success: false,
  message: "Akses ditolak. Sesi tidak valid atau telah berakhir.",
};

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

    const { searchParams } = new URL(request.url);
    const fallback = currentMonthYear();
    const month = Number(searchParams.get("month") || fallback.month);
    const year = Number(searchParams.get("year") || fallback.year);
    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < BUDGET_MIN_YEAR ||
      year > BUDGET_MAX_YEAR
    ) {
      return NextResponse.json(
        { success: false, message: "Bulan atau tahun tidak valid." },
        { status: 400 }
      );
    }

    const data = await getBudgetsWithProgress(user.id, year, month);
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
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, message: parsed.message, errors: parsed.errors },
        { status: parsed.status }
      );
    }

    const budget = await prisma.budget.create({
      data: { ...parsed.data, userId: user.id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Anggaran berhasil dibuat.",
        data: { budget: { ...budget, amount: budget.amount.toNumber() } },
      },
      { status: 201 }
    );
  } catch (error) {
    if (isDuplicateBudgetError(error)) {
      return NextResponse.json(
        { success: false, message: DUPLICATE_BUDGET_MESSAGE, errors: { categoryId: "Anggaran sudah ada" } },
        { status: 409 }
      );
    }
    console.error("POST /api/budgets error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat anggaran." },
      { status: 500 }
    );
  }
}
