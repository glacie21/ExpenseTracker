import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/dashboard";

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

    const data = await getDashboardSummary(user.id);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/dashboard/summary error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat ringkasan data finansial." },
      { status: 500 }
    );
  }
}
