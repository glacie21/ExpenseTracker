import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APP_TIMEZONE } from "@/lib/config";
import { endOfDayUTC } from "@/lib/dates";
import { getReport, parseReportParams } from "@/lib/reports";
import { buildReportPdf } from "@/lib/pdfReport";

// Keeps PDFs a reasonable size; the full data set is available as CSV.
const MAX_PDF_ROWS = 2000;

/**
 * GET /api/reports/pdf — parameter sama dengan GET /api/reports.
 * Menghasilkan laporan PDF untuk pengguna yang login.
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
    const params = parsed.params;

    const where: Prisma.TransactionWhereInput = {
      userId: user.id,
      date: { gte: params.range.start, lte: endOfDayUTC(params.range.end) },
      ...(params.type ? { type: params.type } : {}),
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
    };

    const [report, total, rows] = await Promise.all([
      getReport(user.id, params),
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        select: {
          date: true,
          title: true,
          type: true,
          amount: true,
          category: { select: { name: true } },
        },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
        take: MAX_PDF_ROWS,
      }),
    ]);

    const generatedAt = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: APP_TIMEZONE,
    }).format(new Date());

    const pdf = await buildReportPdf({
      report,
      userName: user.name,
      generatedAt: `${generatedAt} (${APP_TIMEZONE})`,
      totalTransactions: total,
      transactions: rows.map((r) => ({
        date: r.date,
        title: r.title,
        category: r.category.name,
        type: r.type,
        amount: r.amount.toNumber(),
      })),
    });

    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="laporan-${report.period.start}_${report.period.end}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/reports/pdf error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat laporan PDF." },
      { status: 500 }
    );
  }
}
