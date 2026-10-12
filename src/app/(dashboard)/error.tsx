"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
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
    <div className="mx-auto max-w-md py-16" role="alert">
      <h2 className="font-serif text-2xl font-medium text-ink">Halaman gagal dimuat</h2>
      <p className="mt-3 text-ink-2">
        Terjadi kesalahan saat memuat data. Data Anda tetap aman. Silakan coba lagi.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-ink-3">Kode error: {error.digest}</p>}
      <div className="mt-8 flex gap-2">
        <Button onClick={() => retry()}>Coba lagi</Button>
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center rounded-sm border border-rule bg-surface px-4 text-sm font-medium text-ink hover:bg-sunken"
        >
          Ke ringkasan
        </Link>
      </div>
    </div>
  );
}
