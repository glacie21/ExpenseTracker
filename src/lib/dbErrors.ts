import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

/** A unique constraint rejected the write (P2002), e.g. two requests raced past a duplicate check. */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * A foreign key rejected the write, e.g. deleting a category that transactions
 * still use. Prisma reports P2003 for some cases, but an ON DELETE RESTRICT
 * refusal (PostgreSQL 23001) can arrive under another code, or as an unknown
 * error, carrying the database code in its message. Only Prisma errors are
 * sniffed, so an unrelated failure is never mistaken for "still in use".
 */
export function isForeignKeyViolation(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") return true;
  return (
    (error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientUnknownRequestError) &&
    /\b(23001|23503)\b/.test(error.message)
  );
}

/** No row matched a scoped update or delete (P2025). */
export function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

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
