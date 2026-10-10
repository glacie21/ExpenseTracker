import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { endOfDayUTC, monthRangeUTC, parseDateOnly } from "@/lib/dates";
import { isValidId } from "@/lib/validations";
import {
  TRANSACTION_CATEGORY_SELECT,
  parseTransactionBody,
  serializeTransaction,
} from "@/lib/transactions";

/**
 * GET /api/transactions
 * Mengambil daftar transaksi dengan search, filter, sorting, dan server-side pagination.
 *
 * Query: search, type (INCOME|EXPENSE), categoryId, startDate, endDate (YYYY-MM-DD),
 * month (1-12), year, sort (newest|oldest), page, limit (max 100).
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
    const search = searchParams.get("search")?.trim().slice(0, 100) || "";
    const typeParam = searchParams.get("type");
    const categoryId = searchParams.get("categoryId")?.trim() || "";
    const startDate = parseDateOnly(searchParams.get("startDate"));
    const endDate = parseDateOnly(searchParams.get("endDate"));
    const month = parseInt(searchParams.get("month") || "", 10);
    const year = parseInt(searchParams.get("year") || "", 10);
    const sort = searchParams.get("sort") === "oldest" ? "asc" : "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10) || 10));

    // Selalu dibatasi ke pengguna yang login
    const where: Prisma.TransactionWhereInput = {
      userId: user.id,
    };
    const dateFilters: Prisma.TransactionWhereInput[] = [];

    if (typeParam === "INCOME" || typeParam === "EXPENSE") {
      where.type = typeParam;
    }

    if (categoryId) {
      if (!isValidId(categoryId)) {
        return NextResponse.json(
          { success: false, message: "Filter kategori tidak valid." },
          { status: 400 }
        );
      }
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (startDate) {
      dateFilters.push({ date: { gte: startDate } });
    }
    if (endDate) {
      dateFilters.push({ date: { lte: endOfDayUTC(endDate) } });
    }

    const hasYear = Number.isInteger(year) && year >= 1900 && year <= 9999;
    const hasMonth = Number.isInteger(month) && month >= 1 && month <= 12;
    if (hasYear && hasMonth) {
      dateFilters.push({ date: monthRangeUTC(year, month) });
    } else if (hasYear) {
      dateFilters.push({
        date: { gte: monthRangeUTC(year, 1).gte, lte: monthRangeUTC(year, 12).lte },
      });
    }

    if (dateFilters.length > 0) {
      where.AND = dateFilters;
    }

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: { category: { select: TRANSACTION_CATEGORY_SELECT } },
        orderBy: [{ date: sort }, { createdAt: sort }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions.map(serializeTransaction),
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

    const body = await request.json().catch(() => null);
    const parsed = await parseTransactionBody(body, user.id);

    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, message: parsed.message, errors: parsed.errors },
        { status: parsed.status }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        ...parsed.data,
        userId: user.id,
      },
      include: { category: { select: TRANSACTION_CATEGORY_SELECT } },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Transaksi berhasil dicatat.",
        data: { transaction: serializeTransaction(transaction) },
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
