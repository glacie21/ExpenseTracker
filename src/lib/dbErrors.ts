import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

/** A unique constraint rejected the write (P2002), e.g. two requests raced past a duplicate check. */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * A foreign key rejected the write, e.g. deleting a category that transactions
 * still use. Prisma reports P2003 for some cases, but an ON DELETE RESTRICT
 * refusal (PostgreSQL 23001) arrives as an unknown error carrying the code.
 */
export function isForeignKeyViolation(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) return error.code === "P2003";
  return error instanceof Error && /\b(23001|23503)\b/.test(error.message);
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
