-- AlterTable: bumping sessionVersion invalidates every session token issued before it
ALTER TABLE "users" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
