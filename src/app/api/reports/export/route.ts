import { NextRequest, NextResponse } from "next/server";
import { REPORT_FORMATS, isReportFormat, reportFileResponse } from "@/lib/reportFiles";

/**
 * GET /api/reports/export?format=pdf|xlsx|docx — parameter lain sama dengan
 * GET /api/reports. Mengunduh laporan dalam format yang dipilih.
 */
export async function GET(request: NextRequest) {
  const search = new URL(request.url).searchParams;
  const format = search.get("format");
  if (!isReportFormat(format)) {
    return NextResponse.json(
      {
        success: false,
        message: `Format tidak dikenal. Pilih salah satu: ${Object.keys(REPORT_FORMATS).join(", ")}.`,
      },
      { status: 400 }
    );
  }
  return reportFileResponse(search, format);
}
