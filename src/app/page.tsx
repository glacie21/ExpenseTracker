import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Amount } from "@/components/ui/Amount";

// Illustrative month on the landing page (not user data)
const SAMPLE_ENTRIES = [
  { date: "01 Okt", title: "Gaji", category: "Gaji", type: "INCOME", amount: 8_500_000 },
  { date: "02 Okt", title: "Sewa kos", category: "Tempat tinggal", type: "EXPENSE", amount: 1_800_000 },
  { date: "—", title: "Makan & minum", category: "38 transaksi", type: "EXPENSE", amount: 1_240_500 },
  { date: "—", title: "Transportasi", category: "21 transaksi", type: "EXPENSE", amount: 385_000 },
  { date: "15 Okt", title: "Langganan musik & film", category: "Hiburan", type: "EXPENSE", amount: 186_000 },
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
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-center lg:gap-16">
          <div>
            <h1 className="font-serif text-4xl font-medium leading-[1.1] text-ink sm:text-5xl lg:text-6xl">
              Tahu persis ke mana uang Anda pergi.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
              Catat pemasukan dan pengeluaran harian. Di akhir bulan, Anda punya laporan yang jujur:
              berapa yang masuk, berapa yang keluar, dan kategori mana yang paling banyak menyedot.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex h-11 items-center rounded-sm bg-ink px-5 text-sm font-medium text-paper transition-colors hover:bg-ink/85"
              >
                Buat akun gratis
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center rounded-sm border border-rule bg-surface px-5 text-sm font-medium text-ink transition-colors hover:bg-sunken"
              >
                Saya sudah punya akun
              </Link>
            </div>
          </div>

          {/* A sample statement: what the app actually produces */}
          <figure className="rounded-sm border border-rule bg-surface">
            <figcaption className="flex items-baseline justify-between border-b border-rule px-5 py-4">
              <span className="font-serif text-lg text-ink">Oktober 2026</span>
              <span className="text-xs text-ink-3">Contoh</span>
            </figcaption>
            <table className="w-full text-sm">
              <caption className="sr-only">Contoh catatan transaksi satu bulan</caption>
              <tbody>
                {SAMPLE_ENTRIES.map((entry) => (
                  <tr key={entry.title} className="border-b border-rule-soft">
                    <td className="w-20 py-2.5 pr-3 pl-5 align-top font-mono text-xs whitespace-nowrap text-ink-3">{entry.date}</td>
                    <td className="py-2.5 pr-3">
                      <span className="block text-ink">{entry.title}</span>
                      <span className="block text-xs text-ink-3">{entry.category}</span>
                    </td>
                    <td className="py-2.5 pr-5 text-right align-top">
                      <Amount value={entry.amount} type={entry.type} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2} className="pt-4 pl-5 text-left font-normal text-ink-2">
                    Masuk
                  </th>
                  <td className="pt-4 pr-5 text-right">
                    <Amount value={SAMPLE_INCOME} />
                  </td>
                </tr>
                <tr>
                  <th scope="row" colSpan={2} className="pt-1 pl-5 text-left font-normal text-ink-2">
                    Keluar
                  </th>
                  <td className="pt-1 pr-5 text-right">
                    <Amount value={-SAMPLE_EXPENSE} />
                  </td>
                </tr>
                <tr>
                  <th scope="row" colSpan={2} className="pt-3 pb-5 pl-5 text-left font-medium text-ink">
                    Sisa bulan ini
                  </th>
                  <td className="pt-3 pb-5 pr-5 text-right">
                    <span className="rule-total inline-block pb-0.5">
                      <Amount value={SAMPLE_INCOME - SAMPLE_EXPENSE} className="text-lg font-semibold" />
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </figure>
        </section>

        <section className="border-t border-rule bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-20">
            <h2 className="font-serif text-2xl font-medium text-ink sm:text-3xl">Cara kerjanya</h2>
            <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map((step, i) => (
                <li key={step.title} className="border-t border-ink pt-4">
                  <span className="num text-sm text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-1 font-serif text-xl text-ink">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-2">{step.body}</p>
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
