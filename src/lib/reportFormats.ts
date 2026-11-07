/**
 * Downloadable report formats. No server imports here, so the client (export
 * menu, reports page) and the export route share one list.
 */
export const REPORT_FORMATS = {
  pdf: {
    label: "PDF",
    contentType: "application/pdf",
    extension: "pdf",
    /** Transactions listed in the file; the full set is always available as CSV. */
    maxRows: 2000,
  },
  xlsx: {
    label: "Excel",
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: "xlsx",
    maxRows: 50_000,
  },
  docx: {
    label: "Word",
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: "docx",
    maxRows: 2000,
  },
} as const;

export type ReportFormatId = keyof typeof REPORT_FORMATS;

export function isReportFormat(value: string | null): value is ReportFormatId {
  return value !== null && Object.hasOwn(REPORT_FORMATS, value);
}
