import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Amount } from "@/components/ui/Amount";
import { buttonStyles } from "@/components/ui/Button";
import { CategoryMark } from "@/components/ui/CategoryMark";
import { Guilloche } from "@/components/ui/Guilloche";

// Illustrative month on the landing page (not user data)
const SAMPLE_ENTRIES = [
  { when: "1 Okt", title: "Gaji", category: "Gaji", color: "#1b7a4c", type: "INCOME", amount: 8_500_000 },
  { when: "2 Okt", title: "Sewa kos", category: "Tempat tinggal", color: "#6d5bd0", type: "EXPENSE", amount: 1_800_000 },
  { when: "38 transaksi", title: "Makan & minum", category: "Makan", color: "#e08a1e", type: "EXPENSE", amount: 1_240_500 },
  { when: "21 transaksi", title: "Transportasi", category: "Transportasi", color: "#2b7fc4", type: "EXPENSE", amount: 385_000 },
] as const;

const SAMPLE_INCOME = 8_500_000;
const SAMPLE_EXPENSE = 3_611_500;

const STEPS = [
  {
    title: "Catat",
    body: "Setiap pemasukan dan pengeluaran masuk ke kategori, seperti makan, transportasi, atau tagihan. Satu transaksi cukup beberapa detik.",
  },
  {
    title: "Batasi",
    body: "Pasang anggaran bulanan per kategori. Anda diberi tahu saat pengeluaran mendekati 80%, habis, atau sudah lewat batas.",
  },
  {
    title: "Tinjau",
    body: "Bandingkan bulan ini dengan bulan lalu, lihat kategori yang paling boros, lalu unduh laporannya sebagai PDF atau CSV.",
  },
];

export default function LandingPage() {
  const net = SAMPLE_INCOME - SAMPLE_EXPENSE;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-center lg:gap-20">
          <div>
            <h1 className="max-w-xl font-display text-5xl leading-[0.98] font-semibold text-ink sm:text-6xl lg:text-7xl">
              Tahu persis ke mana uang Anda pergi.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-2">
              Catat pemasukan dan pengeluaran harian. Di akhir bulan, Anda punya laporan yang jujur:
              berapa yang masuk, berapa yang keluar, dan kategori mana yang paling banyak menyedot.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/register" className={buttonStyles("primary", "lg")}>
                Buat akun gratis
              </Link>
              <Link href="/login" className={buttonStyles("outline", "lg")}>
                Saya sudah punya akun
              </Link>
            </div>
          </div>

          {/* A sample month: what the app actually produces */}
          <figure className="overflow-hidden rounded-3xl border border-rule bg-surface shadow-[0_30px_60px_-30px_rgb(6_30_25/0.35)]">
            <div className="relative isolate overflow-hidden bg-note px-6 pt-5 pb-6 text-note-ink">
              <Guilloche className="absolute inset-0 -z-10 h-full w-full text-note-line" />
              <figcaption className="flex items-baseline justify-between text-sm">
                <span className="font-medium">Oktober 2026</span>
                <span className="text-xs text-note-ink-2">Contoh</span>
              </figcaption>
              <p className="mt-8 text-sm text-note-ink-2">Sisa bulan ini</p>
              <p className="num mt-1.5 font-display text-5xl leading-none font-semibold">
                <span className="mr-1 align-[0.55em] text-xl font-medium">Rp</span>
                {net.toLocaleString("id-ID")}
              </p>
              <p className="mt-3 flex gap-5 text-xs text-note-ink-2">
                <span>
                  Masuk <span className="num text-note-ink">{SAMPLE_INCOME.toLocaleString("id-ID")}</span>
                </span>
                <span>
                  Keluar <span className="num text-note-ink">{SAMPLE_EXPENSE.toLocaleString("id-ID")}</span>
                </span>
              </p>
            </div>

            <ul className="p-2" aria-label="Contoh catatan transaksi satu bulan">
              {SAMPLE_ENTRIES.map((entry) => (
                <li key={entry.title} className="flex items-center gap-3 px-3 py-2.5">
                  <CategoryMark name={entry.category} color={entry.color} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{entry.title}</p>
                    <p className="truncate text-xs text-ink-3">{entry.when}</p>
                  </div>
                  <Amount value={entry.amount} type={entry.type} className="text-sm font-semibold" />
                </li>
              ))}
            </ul>
          </figure>
        </section>

        <section className="border-t border-rule bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-20">
            <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Cara kerjanya</h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-lg font-semibold text-accent">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-ink">{step.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-ink-2">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-ink-3 sm:flex-row sm:justify-between sm:px-8">
          <span>© {new Date().getFullYear()} Expense Tracker</span>
          <span>Data Anda hanya bisa dilihat oleh Anda.</span>
        </div>
      </footer>
    </div>
  );
}
