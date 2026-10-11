"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center" role="alert">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Halaman gagal dimuat</h2>
        <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">
          Terjadi kesalahan saat memuat data. Data Anda tetap aman. Silakan coba lagi.
        </p>
        {error.digest && <p className="text-xs text-slate-400">Kode error: {error.digest}</p>}
      </div>
      <div className="flex gap-3">
        <Button onClick={() => retry()} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Coba Lagi
        </Button>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Ke Dashboard
        </Link>
      </div>
    </div>
  );
}
