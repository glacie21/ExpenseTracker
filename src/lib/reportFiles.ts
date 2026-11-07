import { NextResponse } from "next/server";
import { UNAUTHORIZED } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { parseReportParams } from "@/lib/reports";
import { ReportExportData, loadReportExport } from "@/lib/reportExport";
import { REPORT_FORMATS, ReportFormatId } from "@/lib/reportFormats";

export { REPORT_FORMATS, isReportFormat } from "@/lib/reportFormats";
export type { ReportFormatId } from "@/lib/reportFormats";

type Builder = (data: ReportExportData) => Promise<Uint8Array>;

/** Loaded on demand: each document library is only needed for its own format. */
const BUILDERS: Record<ReportFormatId, () => Promise<Builder>> = {
  pdf: async () => (await import("@/lib/pdfReport")).buildReportPdf,
  xlsx: async () => (await import("@/lib/xlsxReport")).buildReportXlsx,
  docx: async () => (await import("@/lib/docxReport")).buildReportDocx,
};

/** Builds the report file for the signed-in user from the report query parameters. */
export async function reportFileResponse(search: URLSearchParams, formatId: ReportFormatId): Promise<Response> {
  const format = REPORT_FORMATS[formatId];
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const parsed = parseReportParams(search);
    if (!parsed.ok) {
      return NextResponse.json({ success: false, message: parsed.message }, { status: 400 });
    }

    const [data, build] = await Promise.all([
      loadReportExport(user, parsed.params, format.maxRows),
      BUILDERS[formatId](),
    ]);
    const file = await build(data);
    const { start, end } = data.report.period;

    return new Response(file as BodyInit, {
      headers: {
        "Content-Type": format.contentType,
        "Content-Disposition": `attachment; filename="laporan-${start}_${end}.${format.extension}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(`Report ${formatId} export error:`, error);
    return NextResponse.json(
      { success: false, message: `Gagal membuat laporan ${format.label}.` },
      { status: 500 }
    );
  }
}
