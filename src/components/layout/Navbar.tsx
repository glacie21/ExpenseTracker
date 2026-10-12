import Link from "next/link";
import { Wordmark } from "@/components/layout/Wordmark";

export function Navbar() {
  return (
    <nav className="border-b border-rule">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
        <Wordmark />

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/login"
            className="rounded-sm px-3 py-2 text-sm text-ink-2 transition-colors hover:text-ink"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center rounded-sm bg-ink px-4 text-sm font-medium text-paper transition-colors hover:bg-ink/85"
          >
            Buat akun
          </Link>
        </div>
      </div>
    </nav>
  );
}
