import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parseReportParams } from "@/lib/reports";
import { ReportExportData, loadReportExport } from "@/lib/reportExport";
import { buildReportPdf } from "@/lib/pdfReport";
import { buildReportXlsx } from "@/lib/xlsxReport";
import { buildReportDocx } from "@/lib/docxReport";

interface ReportFormat {
  label: string;
  contentType: string;
  extension: string;
  /** Transactions listed in the file; the full set is always available as CSV. */
  maxRows: number;
  build: (data: ReportExportData) => Promise<Uint8Array>;
}

export const REPORT_FORMATS = {
  pdf: {
    label: "PDF",
    contentType: "application/pdf",
    extension: "pdf",
    maxRows: 2000,
    build: buildReportPdf,
  },
  xlsx: {
    label: "Excel",
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: "xlsx",
    maxRows: 50_000,
    build: buildReportXlsx,
  },
  docx: {
    label: "Word",
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: "docx",
    maxRows: 2000,
    build: buildReportDocx,
  },
} satisfies Record<string, ReportFormat>;

export type ReportFormatId = keyof typeof REPORT_FORMATS;

export function isReportFormat(value: string | null): value is ReportFormatId {
  return value !== null && Object.hasOwn(REPORT_FORMATS, value);
}

/** Builds the report file for the signed-in user from the report query parameters. */
export async function reportFileResponse(search: URLSearchParams, formatId: ReportFormatId): Promise<Response> {
  const format: ReportFormat = REPORT_FORMATS[formatId];
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Sesi tidak valid atau telah berakhir." },
        { status: 401 }
      );
    }

    const parsed = parseReportParams(search);
    if (!parsed.ok) {
      return NextResponse.json({ success: false, message: parsed.message }, { status: 400 });
    }

    const data = await loadReportExport(user, parsed.params, format.maxRows);
    const file = await format.build(data);
    const { start, end } = data.report.period;

    return new Response(Buffer.from(file), {
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
