import { NextRequest } from "next/server";
import { reportFileResponse } from "@/lib/reportFiles";

/**
 * GET /api/reports/pdf — parameter sama dengan GET /api/reports.
 * Sama dengan GET /api/reports/export?format=pdf; dipertahankan untuk tautan lama.
 */
export async function GET(request: NextRequest) {
  return reportFileResponse(new URL(request.url).searchParams, "pdf");
}
