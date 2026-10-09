import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dashboard/summary
 * Mengambil ringkasan saldo, pemasukan, pengeluaran, tabungan,
 * serta 5 transaksi terbaru langsung dihitung dari database PostgreSQL.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Sesi tidak valid atau telah berakhir." },
        { status: 401 }
      );
    }

    // Hitung agregasi database
    const [incomeAgg, expenseAgg, recentTransactions] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId: user.id, type: "INCOME" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { userId: user.id, type: "EXPENSE" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.findMany({
        where: { userId: user.id },
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
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 5,
      }),
    ]);

    const totalIncome = Number(incomeAgg._sum.amount || 0);
    const totalExpense = Number(expenseAgg._sum.amount || 0);
    const totalBalance = totalIncome - totalExpense;
    const netSavings = totalBalance;

    const formattedRecent = recentTransactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpense,
          totalBalance,
          netSavings,
          incomeCount: incomeAgg._count || 0,
          expenseCount: expenseAgg._count || 0,
          totalCount: (incomeAgg._count || 0) + (expenseAgg._count || 0),
        },
        recentTransactions: formattedRecent,
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard/summary error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat ringkasan data finansial." },
      { status: 500 }
    );
  }
}
