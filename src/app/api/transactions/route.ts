import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateTransactionInput } from "@/lib/validations";
import { TransactionType } from "@/types";
import { Prisma } from "@prisma/client";

/**
 * GET /api/transactions
 * Mengambil daftar transaksi dengan search, filter, sorting, dan server-side pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Sesi tidak valid atau telah berakhir." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const typeParam = searchParams.get("type");
    const categoryId = searchParams.get("categoryId")?.trim() || "";
    const startDate = searchParams.get("startDate")?.trim() || "";
    const endDate = searchParams.get("endDate")?.trim() || "";
    const sort = searchParams.get("sort") === "oldest" ? "asc" : "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10) || 10));

    // Susun filter query
    const where: Prisma.TransactionWhereInput = {
      userId: user.id,
    };

    if (typeParam === "INCOME" || typeParam === "EXPENSE") {
      where.type = typeParam as TransactionType;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        // Akhir hari (23:59:59.999)
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    // Hitung total data yang cocok untuk pagination
    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
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
        orderBy: [{ date: sort }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Format Decimal amount menjadi number agar serializable secara aman
    const formattedTransactions = transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
    }));

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil daftar transaksi." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions
 * Menambahkan transaksi baru (Income atau Expense).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Sesi tidak valid atau telah berakhir." },
        { status: 401 }
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

    // Verifikasi kategori: harus milik user ini dan sesuai tipe transaksi
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

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId,
        type,
        amount: new Prisma.Decimal(amountNum.toFixed(2)),
        title,
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

    return NextResponse.json(
      {
        success: true,
        message: "Transaksi berhasil dicatat.",
        data: {
          transaction: {
            ...transaction,
            amount: Number(transaction.amount),
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan transaksi." },
      { status: 500 }
    );
  }
}
