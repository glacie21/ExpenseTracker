import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getReport, parseReportParams } from "@/lib/reports";

/**
 * GET /api/reports?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&periodType=week|month|year|custom
 *   &type=ALL|INCOME|EXPENSE&categoryId=...
 * Ringkasan laporan keuangan pengguna yang login untuk rentang & filter tersebut.
 * Daftar transaksinya diambil dari GET /api/transactions dengan filter yang sama.
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

    const parsed = parseReportParams(new URL(request.url).searchParams);
    if (!parsed.ok) {
      return NextResponse.json({ success: false, message: parsed.message }, { status: 400 });
    }

    const report = await getReport(user.id, parsed.params);
    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat laporan keuangan." },
      { status: 500 }
    );
  }
}
