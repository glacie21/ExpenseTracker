import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateCategoryInput } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/categories/[id]
 * Memperbarui nama dan warna kategori milik pengguna yang sedang login.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Sesi tidak valid atau telah berakhir." },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID kategori tidak valid." },
        { status: 400 }
      );
    }

    // Pastikan kategori ada dan dimiliki oleh user yang sedang login
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category || category.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Kategori tidak ditemukan atau Anda tidak memiliki akses." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = validateCategoryInput({
      name: body.name,
      type: category.type, // Tipe tidak boleh diubah untuk integritas transaksi
      color: body.color,
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
    const newColor = body.color?.trim() || category.color;

    // Jika nama berubah, cek apakah nama baru bentrok
    if (newName.toLowerCase() !== category.name.toLowerCase()) {
      const conflict = await prisma.category.findUnique({
        where: {
          userId_name_type: {
            userId: user.id,
            name: newName,
            type: category.type,
          },
        },
      });

      if (conflict && conflict.id !== category.id) {
        return NextResponse.json(
          {
            success: false,
            message: `Kategori "${newName}" sudah ada untuk tipe ${category.type}.`,
            errors: { name: "Nama kategori sudah ada" },
          },
          { status: 409 }
        );
      }
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
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Sesi tidak valid atau telah berakhir." },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID kategori tidak valid." },
        { status: 400 }
      );
    }

    // Pastikan kategori ada dan dimiliki oleh user yang sedang login
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!category || category.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Kategori tidak ditemukan atau Anda tidak memiliki akses." },
        { status: 404 }
      );
    }

    // Cek apakah kategori masih dipakai oleh transaksi
    const transactionCount = category._count.transactions;
    if (transactionCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Kategori "${category.name}" tidak dapat dihapus karena masih digunakan oleh ${transactionCount} transaksi. Silakan ubah atau pindahkan kategori transaksi tersebut terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: category.id },
    });

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
