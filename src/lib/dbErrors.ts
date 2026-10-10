import { NextResponse } from "next/server";

/**
 * PostgreSQL rejects text it cannot store in the database encoding
 * (22P05: untranslatable character, 22021: invalid byte sequence), e.g.
 * emoji in a non-UTF-8 database. Prisma surfaces it as an unknown error.
 */
export function isUnsupportedCharacterError(error: unknown): boolean {
  return error instanceof Error && /\b(22P05|22021)\b/.test(error.message);
}

/** 400 response for text the database cannot store; never exposes DB details. */
export function unsupportedCharacterResponse() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Teks mengandung karakter yang tidak didukung oleh database (misalnya emoji). Hapus karakter tersebut dan coba lagi.",
    },
    { status: 400 }
  );
}
