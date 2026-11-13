import { NextRequest, NextResponse } from "next/server";
import { UNAUTHORIZED } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isUniqueViolation, isUnsupportedCharacterError, unsupportedCharacterResponse } from "@/lib/dbErrors";
import { DEFAULT_CATEGORY_COLOR, duplicateCategoryResponse, findCategoryNameConflict } from "@/lib/categories";
import { validationErrorResponse } from "@/lib/apiResponse";
import { validateCategoryInput } from "@/lib/validations";
import { TransactionType } from "@/types";

/**
 * GET /api/categories
 * Mengambil daftar kategori milik pengguna yang sedang login.
 * Mendukung filter opsional `?type=INCOME|EXPENSE`.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");

    const categories = await prisma.category.findMany({
      where: {
        userId: user.id,
        ...(typeParam === "INCOME" || typeParam === "EXPENSE" ? { type: typeParam } : {}),
      },
      // Usage counts cost a count per category; only the categories page asks for them
      ...(searchParams.has("withCounts") ? { include: { _count: { select: { transactions: true } } } } : {}),
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil daftar kategori." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Menambahkan kategori baru untuk pengguna yang sedang login.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateCategoryInput(body ?? {});

    if (!validation.isValid) {
      return validationErrorResponse(validation.errors, "Data kategori tidak valid");
    }

    const name = body.name.trim();
    const type = body.type as TransactionType;
    const color = (typeof body.color === "string" && body.color.trim()) || DEFAULT_CATEGORY_COLOR;

    if (await findCategoryNameConflict(user.id, type, name)) return duplicateCategoryResponse(name, type);

    const category = await prisma.category.create({
      data: {
        userId: user.id,
        name,
        type,
        color,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Kategori berhasil ditambahkan.",
        data: { category },
      },
      { status: 201 }
    );
  } catch (error) {
    if (isUnsupportedCharacterError(error)) return unsupportedCharacterResponse();
    if (isUniqueViolation(error)) return duplicateCategoryResponse();
    console.error("POST /api/categories error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat kategori baru." },
      { status: 500 }
    );
  }
}
