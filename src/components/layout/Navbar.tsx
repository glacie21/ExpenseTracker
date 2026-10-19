import Link from "next/link";
import { Wordmark } from "@/components/layout/Wordmark";
import { buttonStyles } from "@/components/ui/Button";

export function Navbar() {
  return (
    <nav className="border-b border-rule">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
        <Wordmark />

        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/login" className={buttonStyles("ghost")}>
            Masuk
          </Link>
          <Link href="/register" className={buttonStyles("primary")}>
            Buat akun
          </Link>
        </div>
      </div>
    </nav>
  );
}
