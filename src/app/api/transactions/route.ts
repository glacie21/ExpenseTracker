import { NextRequest, NextResponse } from "next/server";
import { UNAUTHORIZED } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isUnsupportedCharacterError, unsupportedCharacterResponse } from "@/lib/dbErrors";
import {
  TRANSACTION_CATEGORY_SELECT,
  buildTransactionFilter,
  parseErrorResponse,
  parseTransactionBody,
  serializeTransaction,
} from "@/lib/transactions";

// Upper bound keeps skip a safe integer; pages past the end just come back empty
const MAX_PAGE = 1_000_000;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/** A positive integer query value, clamped to 1..max; anything else becomes `fallback`. */
function intParam(value: string | null, fallback: number, max: number): number {
  return Math.min(max, Math.max(1, parseInt(value ?? "", 10) || fallback));
}

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
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = intParam(searchParams.get("page"), 1, MAX_PAGE);
    const limit = intParam(searchParams.get("limit"), DEFAULT_LIMIT, MAX_LIMIT);

    // Filter yang sama dipakai oleh ekspor CSV dan laporan; selalu dibatasi ke user login
    const filter = buildTransactionFilter(user.id, searchParams);
    if (!filter.ok) {
      return NextResponse.json({ success: false, message: filter.message }, { status: 400 });
    }
    const { where, sort } = filter;

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
    if (isUnsupportedCharacterError(error)) return unsupportedCharacterResponse();
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
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = await parseTransactionBody(body, user.id);

    if (!parsed.ok) return parseErrorResponse(parsed);

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
    if (isUnsupportedCharacterError(error)) return unsupportedCharacterResponse();
    console.error("POST /api/transactions error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan transaksi." },
      { status: 500 }
    );
  }
}
