import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardAnalytics, resolvePeriodFromParams } from "@/lib/analytics";

/**
 * GET /api/analytics?period=<preset>&start=YYYY-MM-DD&end=YYYY-MM-DD
 * Statistik dashboard untuk satu periode: ringkasan, tren vs periode
 * sebelumnya, deret waktu pemasukan/pengeluaran, dan distribusi pengeluaran.
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
    const { valid, period } = resolvePeriodFromParams({
      period: searchParams.get("period"),
      start: searchParams.get("start"),
      end: searchParams.get("end"),
    });
    if (!valid) {
      return NextResponse.json(
        { success: false, message: "Periode tidak valid." },
        { status: 400 }
      );
    }

    const analytics = await getDashboardAnalytics(user.id, period);

    return NextResponse.json({
      success: true,
      data: {
        period: {
          preset: period.preset,
          start: period.start,
          end: period.end,
          label: period.label,
          previousLabel: period.previousLabel,
        },
        ...analytics,
      },
    });
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat statistik keuangan." },
      { status: 500 }
    );
  }
}
