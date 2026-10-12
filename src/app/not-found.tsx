import Link from "next/link";

export const metadata = {
  title: "Halaman tidak ditemukan - Expense Tracker",
};

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-24">
      <p className="num text-sm text-ink-3">404</p>
      <h1 className="mt-1 font-serif text-3xl font-medium text-ink">Halaman tidak ditemukan</h1>
      <p className="mt-3 text-ink-2">Halaman yang Anda cari tidak ada atau sudah dipindahkan.</p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex h-9 w-fit items-center rounded-sm bg-ink px-4 text-sm font-medium text-paper hover:bg-ink/85"
      >
        Kembali ke ringkasan
      </Link>
    </main>
  );
}
