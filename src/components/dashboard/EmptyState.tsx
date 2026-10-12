import React from "react";
import Link from "next/link";

export function EmptyState() {
  return (
    <section className="rounded-sm border border-dashed border-rule px-6 py-12 text-center sm:py-16">
      <h2 className="font-serif text-xl text-ink">Buku kas Anda masih kosong</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-2">
        Catat pemasukan atau pengeluaran pertama Anda. Ringkasan, grafik, dan anggaran akan terisi
        dari transaksi yang tersimpan.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/transactions?add=EXPENSE"
          className="inline-flex h-9 items-center rounded-sm bg-ink px-4 text-sm font-medium text-paper hover:bg-ink/85"
        >
          Catat pengeluaran
        </Link>
        <Link
          href="/transactions?add=INCOME"
          className="inline-flex h-9 items-center rounded-sm border border-rule bg-surface px-4 text-sm font-medium text-ink hover:bg-sunken"
        >
          Catat pemasukan
        </Link>
      </div>
    </section>
  );
}
