import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isUnsupportedCharacterError, unsupportedCharacterResponse } from "@/lib/dbErrors";
import { isValidId } from "@/lib/validations";
import {
  TRANSACTION_CATEGORY_SELECT,
  parseTransactionBody,
  serializeTransaction,
} from "@/lib/transactions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const UNAUTHORIZED = {
  success: false,
  message: "Akses ditolak. Sesi tidak valid atau telah berakhir.",
};

// Same response for "does not exist" and "belongs to another user" so ids cannot be probed
const NOT_FOUND = {
  success: false,
  message: "Transaksi tidak ditemukan atau Anda tidak memiliki akses.",
};

/**
 * GET /api/transactions/[id]
 * Mengambil detail transaksi spesifik milik pengguna yang sedang login.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
      include: { category: { select: TRANSACTION_CATEGORY_SELECT } },
    });

    if (!transaction) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { transaction: serializeTransaction(transaction) },
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
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = await parseTransactionBody(body, user.id);

    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, message: parsed.message, errors: parsed.errors },
        { status: parsed.status }
      );
    }

    // updateMany scoped by userId keeps the ownership check atomic
    const result = await prisma.transaction.updateMany({
      where: { id, userId: user.id },
      data: parsed.data,
    });

    if (result.count === 0) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }

    const updated = await prisma.transaction.findFirstOrThrow({
      where: { id, userId: user.id },
      include: { category: { select: TRANSACTION_CATEGORY_SELECT } },
    });

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil diperbarui.",
      data: { transaction: serializeTransaction(updated) },
    });
  } catch (error) {
    if (isUnsupportedCharacterError(error)) return unsupportedCharacterResponse();
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
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }

    const result = await prisma.transaction.deleteMany({
      where: { id, userId: user.id },
    });

    if (result.count === 0) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }

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
