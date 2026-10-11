import Link from "next/link";
import { Compass } from "lucide-react";

export const metadata = {
  title: "Halaman tidak ditemukan - Expense Tracker",
};

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
        <Compass className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-emerald-600">404</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Halaman tidak ditemukan</h1>
        <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">
          Halaman yang Anda cari tidak ada atau sudah dipindahkan.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
      >
        Kembali ke Dashboard
      </Link>
    </main>
  );
}
