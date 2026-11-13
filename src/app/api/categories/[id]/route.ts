import { NextRequest, NextResponse } from "next/server";
import { UNAUTHORIZED } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isForeignKeyViolation,
  isRecordNotFound,
  isUniqueViolation,
  isUnsupportedCharacterError,
  unsupportedCharacterResponse,
} from "@/lib/dbErrors";
import { duplicateCategoryResponse, findCategoryNameConflict } from "@/lib/categories";
import { validationErrorResponse } from "@/lib/apiResponse";
import { isValidId, validateCategoryInput } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const NOT_FOUND = {
  success: false,
  message: "Kategori tidak ditemukan atau Anda tidak memiliki akses.",
};

/**
 * PUT /api/categories/[id]
 * Memperbarui nama dan warna kategori milik pengguna yang sedang login.
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

    // Pastikan kategori ada dan dimiliki oleh user yang sedang login
    const category = await prisma.category.findFirst({
      where: { id, userId: user.id },
      select: { id: true, type: true, color: true },
    });

    if (!category) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateCategoryInput({
      name: body?.name,
      type: category.type, // Tipe tidak boleh diubah untuk integritas transaksi
      color: body?.color,
    });

    if (!validation.isValid) {
      return validationErrorResponse(validation.errors, "Data kategori tidak valid");
    }

    const newName = body.name.trim();
    const newColor = (typeof body.color === "string" && body.color.trim()) || category.color;

    if (await findCategoryNameConflict(user.id, category.type, newName, category.id)) {
      return duplicateCategoryResponse(newName, category.type);
    }

    const updated = await prisma.category.update({
      where: { id: category.id },
      data: {
        name: newName,
        color: newColor,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Kategori berhasil diperbarui.",
      data: { category: updated },
    });
  } catch (error) {
    if (isUnsupportedCharacterError(error)) return unsupportedCharacterResponse();
    if (isUniqueViolation(error)) return duplicateCategoryResponse();
    console.error("PUT /api/categories/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui kategori." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/[id]
 * Menghapus kategori secara aman jika tidak sedang digunakan oleh transaksi.
 * Transaksi tidak pernah ikut terhapus (relasi onDelete: Restrict).
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

    // Delete first: the foreign keys (onDelete: Restrict) refuse a category that
    // transactions or budgets still use, and only then are the usage counts needed.
    try {
      const deleted = await prisma.category.delete({
        where: { id, userId: user.id },
        select: { name: true },
      });
      return NextResponse.json({
        success: true,
        message: `Kategori "${deleted.name}" berhasil dihapus.`,
      });
    } catch (error) {
      if (isRecordNotFound(error)) return NextResponse.json(NOT_FOUND, { status: 404 });
      if (!isForeignKeyViolation(error)) throw error;
    }

    const category = await prisma.category.findFirst({
      where: { id, userId: user.id },
      select: { name: true, _count: { select: { transactions: true, budgets: true } } },
    });
    if (!category) return NextResponse.json(NOT_FOUND, { status: 404 });

    let message = `Kategori "${category.name}" tidak dapat dihapus karena masih digunakan. Muat ulang halaman dan coba lagi.`;
    if (category._count.transactions > 0) {
      message = `Kategori "${category.name}" tidak dapat dihapus karena masih digunakan oleh ${category._count.transactions} transaksi. Silakan pindahkan transaksi tersebut ke kategori lain terlebih dahulu.`;
    } else if (category._count.budgets > 0) {
      message = `Kategori "${category.name}" tidak dapat dihapus karena masih memiliki ${category._count.budgets} anggaran. Hapus anggaran tersebut di halaman Budgets terlebih dahulu.`;
    }
    return NextResponse.json({ success: false, message }, { status: 400 });
  } catch (error) {
    console.error("DELETE /api/categories/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus kategori." },
      { status: 500 }
    );
  }
}
