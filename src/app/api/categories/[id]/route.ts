import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isUnsupportedCharacterError, unsupportedCharacterResponse } from "@/lib/dbErrors";
import { isValidId, validateCategoryInput } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const UNAUTHORIZED = {
  success: false,
  message: "Akses ditolak. Sesi tidak valid atau telah berakhir.",
};

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
      return NextResponse.json(
        {
          success: false,
          message: "Data kategori tidak valid",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const newName = body.name.trim();
    const newColor = (typeof body.color === "string" && body.color.trim()) || category.color;

    // Cek bentrok nama (tidak peka huruf besar/kecil) dengan kategori lain
    const conflict = await prisma.category.findFirst({
      where: {
        userId: user.id,
        type: category.type,
        name: { equals: newName, mode: "insensitive" },
        NOT: { id: category.id },
      },
    });

    if (conflict) {
      return NextResponse.json(
        {
          success: false,
          message: `Kategori "${newName}" sudah ada untuk tipe ${category.type}.`,
          errors: { name: "Nama kategori sudah ada" },
        },
        { status: 409 }
      );
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

    const category = await prisma.category.findFirst({
      where: { id, userId: user.id },
      include: {
        _count: {
          select: { transactions: true, budgets: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }

    const inUseResponse = (message: string) =>
      NextResponse.json({ success: false, message }, { status: 400 });

    // Cek apakah kategori masih dipakai oleh transaksi
    if (category._count.transactions > 0) {
      return inUseResponse(
        `Kategori "${category.name}" tidak dapat dihapus karena masih digunakan oleh ${category._count.transactions} transaksi. Silakan pindahkan transaksi tersebut ke kategori lain terlebih dahulu.`
      );
    }

    // Cek apakah kategori masih memiliki anggaran
    if (category._count.budgets > 0) {
      return inUseResponse(
        `Kategori "${category.name}" tidak dapat dihapus karena masih memiliki ${category._count.budgets} anggaran. Hapus anggaran tersebut di halaman Budgets terlebih dahulu.`
      );
    }

    try {
      await prisma.category.delete({
        where: { id: category.id },
      });
    } catch (error) {
      // Transaksi/anggaran ditambahkan di antara pengecekan dan penghapusan (FK Restrict)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        return inUseResponse(
          `Kategori "${category.name}" tidak dapat dihapus karena masih digunakan. Muat ulang halaman dan coba lagi.`
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: `Kategori "${category.name}" berhasil dihapus.`,
    });
  } catch (error) {
    console.error("DELETE /api/categories/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus kategori." },
      { status: 500 }
    );
  }
}
