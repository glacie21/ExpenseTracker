import { NextResponse } from "next/server";

/** A request body that a parse*Body helper rejected. */
export type ParseFailure = { ok: false; status: number; message: string; errors?: Record<string, string> };

/** The response for a body that a parse*Body helper rejected. */
export function parseErrorResponse(failure: ParseFailure) {
  return NextResponse.json(
    { success: false, message: failure.message, errors: failure.errors },
    { status: failure.status }
  );
}
