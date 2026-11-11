import { NextResponse } from "next/server";
import { tooManyRequestsMessage } from "@/lib/rateLimit";

/** 400 with per-field messages from a validate*Input helper. */
export function validationErrorResponse(errors: Record<string, string>) {
  return NextResponse.json({ success: false, message: "Data input tidak valid", errors }, { status: 400 });
}

/** 429 after a rate limit; the limit check and hit stay at each call site. */
export function tooManyRequestsResponse(retryAfter: number) {
  return NextResponse.json(
    { success: false, message: tooManyRequestsMessage(retryAfter) },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

/** A request body that a parse*Body helper rejected. */
export type ParseFailure = { ok: false; status: number; message: string; errors?: Record<string, string> };

/** The response for a body that a parse*Body helper rejected. */
export function parseErrorResponse(failure: ParseFailure) {
  return NextResponse.json(
    { success: false, message: failure.message, errors: failure.errors },
    { status: failure.status }
  );
}
