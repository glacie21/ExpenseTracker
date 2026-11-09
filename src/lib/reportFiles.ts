import { NextResponse } from "next/server";
import { UNAUTHORIZED } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { ReportParams, parseReportParams } from "@/lib/reports";
import { loadReportExport, loadReportStream } from "@/lib/reportExport";
import { REPORT_FORMATS, ReportFormatId } from "@/lib/reportFormats";

export { REPORT_FORMATS, isReportFormat } from "@/lib/reportFormats";
export type { ReportFormatId } from "@/lib/reportFormats";

interface ReportFile {
  body: BodyInit;
  start: string;
  end: string;
}

type ReportUser = { id: string; name: string };

/**
 * Loads each format's data and builds its file. The document libraries are
 * imported on demand, since a request only ever needs one of them.
 */
const BUILDERS: Record<
  ReportFormatId,
  (user: ReportUser, params: ReportParams, maxRows: number) => Promise<ReportFile>
> = {
  pdf: async (user, params, maxRows) => {
    const [data, { buildReportPdf }] = await Promise.all([
      loadReportExport(user, params, maxRows),
      import("@/lib/pdfReport"),
    ]);
    return { body: (await buildReportPdf(data)) as BodyInit, ...data.report.period };
  },
  docx: async (user, params, maxRows) => {
    const [data, { buildReportDocx }] = await Promise.all([
      loadReportExport(user, params, maxRows),
      import("@/lib/docxReport"),
    ]);
    return { body: (await buildReportDocx(data)) as BodyInit, ...data.report.period };
  },
  xlsx: async (user, params, maxRows) => {
    const [data, { buildReportXlsx }] = await Promise.all([
      loadReportStream(user, params, maxRows),
      import("@/lib/xlsxReport"),
    ]);
    return { body: buildReportXlsx(data), ...data.report.period };
  },
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

    const { body, start, end } = await BUILDERS[formatId](user, parsed.params, format.maxRows);

    return new Response(body, {
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
