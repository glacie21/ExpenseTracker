import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureUserCategories } from "@/lib/categories";
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
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Sesi tidak valid atau telah berakhir." },
        { status: 401 }
      );
    }

    // Pastikan kategori default terinisialisasi jika user baru pertama kali akses
    await ensureUserCategories(user.id);

    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");

    const whereClause: {
      userId: string;
      type?: TransactionType;
    } = {
      userId: user.id,
    };

    if (typeParam === "INCOME" || typeParam === "EXPENSE") {
      whereClause.type = typeParam;
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { transactions: true },
        },
      },
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
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Sesi tidak valid atau telah berakhir." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateCategoryInput(body ?? {});

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

    const name = body.name.trim();
    const type = body.type as TransactionType;
    const color = (typeof body.color === "string" && body.color.trim()) || "#64748b";

    // Cek duplikasi kategori untuk pengguna ini (tidak peka huruf besar/kecil)
    const existing = await prisma.category.findFirst({
      where: {
        userId: user.id,
        type,
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: `Kategori "${name}" untuk tipe ${type} sudah ada.`,
          errors: { name: "Nama kategori sudah ada untuk tipe ini" },
        },
        { status: 409 }
      );
    }

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
    console.error("POST /api/categories error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat kategori baru." },
      { status: 500 }
    );
  }
}
