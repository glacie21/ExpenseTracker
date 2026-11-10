import { NextRequest, NextResponse } from "next/server";
import { UNAUTHORIZED } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isUnsupportedCharacterError, unsupportedCharacterResponse } from "@/lib/dbErrors";
import { isValidId } from "@/lib/validations";
import {
  TRANSACTION_CATEGORY_SELECT,
  parseErrorResponse,
  parseTransactionBody,
  serializeTransaction,
} from "@/lib/transactions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Same response for "does not exist" and "belongs to another user" so ids cannot be probed
const NOT_FOUND = {
  success: false,
  message: "Transaksi tidak ditemukan atau Anda tidak memiliki akses.",
};

/** The id from the URL, or null when it cannot be a transaction id. */
async function routeId(params: RouteParams["params"]): Promise<string | null> {
  const { id } = await params;
  return isValidId(id) ? id : null;
}

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

    const id = await routeId(params);
    if (!id) {
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

    const id = await routeId(params);
    if (!id) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }

    // Ownership and body checks run together; "not found" still wins over a bad body
    const body = await request.json().catch(() => null);
    const [existing, parsed] = await Promise.all([
      prisma.transaction.findFirst({ where: { id, userId: user.id }, select: { id: true } }),
      parseTransactionBody(body, user.id),
    ]);

    if (!existing) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }
    if (!parsed.ok) return parseErrorResponse(parsed);

    let updated;
    try {
      // Scoped by userId, so the ownership check stays atomic with the write
      updated = await prisma.transaction.update({
        where: { id, userId: user.id },
        data: parsed.data,
        include: { category: { select: TRANSACTION_CATEGORY_SELECT } },
      });
    } catch (error) {
      // Deleted between the check and the update
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return NextResponse.json(NOT_FOUND, { status: 404 });
      }
      throw error;
    }

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

    const id = await routeId(params);
    if (!id) {
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
