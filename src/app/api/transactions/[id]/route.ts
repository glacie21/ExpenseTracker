import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateTransactionInput } from "@/lib/validations";
import { TransactionType } from "@/types";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/transactions/[id]
 * Mengambil detail transaksi spesifik milik pengguna yang sedang login.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Sesi tidak valid atau telah berakhir." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!transaction || transaction.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Transaksi tidak ditemukan atau Anda tidak memiliki akses." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction: {
          ...transaction,
          amount: Number(transaction.amount),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/transactions/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil detail transaksi." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/transactions/[id]
 * Memperbarui transaksi milik pengguna yang sedang login.
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
    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Transaksi tidak ditemukan atau Anda tidak memiliki akses." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = validateTransactionInput(body);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Data transaksi tidak valid",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const type = body.type as TransactionType;
    const title = body.title.trim();
    const amountNum = parseFloat(body.amount);
    const categoryId = body.categoryId.trim();
    const description = body.description ? body.description.trim() : null;
    const date = new Date(body.date);

    // Verifikasi kategori
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || category.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Kategori tidak ditemukan atau Anda tidak memiliki akses ke kategori ini.",
          errors: { categoryId: "Kategori tidak valid" },
        },
        { status: 400 }
      );
    }

    if (category.type !== type) {
      return NextResponse.json(
        {
          success: false,
          message: `Kategori "${category.name}" adalah kategori ${category.type}, tidak dapat digunakan untuk transaksi ${type}.`,
          errors: { categoryId: "Tipe kategori tidak cocok dengan tipe transaksi" },
        },
        { status: 400 }
      );
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        type,
        title,
        amount: new Prisma.Decimal(amountNum.toFixed(2)),
        categoryId,
        description,
        date,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil diperbarui.",
      data: {
        transaction: {
          ...updated,
          amount: Number(updated.amount),
        },
      },
    });
  } catch (error) {
    console.error("PUT /api/transactions/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui transaksi." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/transactions/[id]
 * Menghapus transaksi milik pengguna yang sedang login.
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
    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Transaksi tidak ditemukan atau Anda tidak memiliki akses." },
        { status: 404 }
      );
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE /api/transactions/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus transaksi." },
      { status: 500 }
    );
  }
}
