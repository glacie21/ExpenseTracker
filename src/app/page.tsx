import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Database,
  BarChart2,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
          {/* Subtle background glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Stage badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-6 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Tahap 1: Fondasi Arsitektur & Autentikasi Siap
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl dark:text-white max-w-4xl mx-auto leading-tight">
              Kendalikan Keuangan Pribadi Anda dengan{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Lebih Cerdas & Aman
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Expense Tracker modern dengan teknologi Next.js App Router, PostgreSQL, dan Prisma. 
              Dirancang untuk kemudahan pemantauan saldo, pemasukan, dan pengeluaran harian Anda.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-8"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Mulai Sekarang Gratis
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-8"
                >
                  Masuk ke Akun
                </Button>
              </Link>
            </div>

            {/* Trust Points */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Password Bcrypt Hashing
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Next.js App Router
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                PostgreSQL & Prisma ORM
              </span>
            </div>

            {/* Interactive Preview Mockup Card */}
            <div className="mt-16 max-w-4xl mx-auto">
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-2 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70 sm:p-4">
                <div className="rounded-xl border border-slate-200/60 bg-white p-5 text-left dark:border-slate-800/80 dark:bg-slate-950">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-rose-400" />
                      <div className="h-3 w-3 rounded-full bg-amber-400" />
                      <div className="h-3 w-3 rounded-full bg-emerald-400" />
                      <span className="ml-2 text-xs font-mono text-slate-400">
                        dashboard.expensetracker.app
                      </span>
                    </div>
                    <Badge variant="success">Protected Route</Badge>
                  </div>

                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-medium">TOTAL SALDO</span>
                      <p className="text-base font-bold text-slate-800 dark:text-white mt-1">Rp 0</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-medium">PEMASUKAN</span>
                      <p className="text-base font-bold text-teal-600 mt-1">Rp 0</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-medium">PENGELUARAN</span>
                      <p className="text-base font-bold text-rose-500 mt-1">Rp 0</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-medium">TABUNGAN</span>
                      <p className="text-base font-bold text-indigo-600 mt-1">Rp 0</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Preview Section */}
        <section id="features" className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Fitur & Rencana Pengembangan
              </h2>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Dibangun Bertahap dengan Arsitektur Bersih
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:border-emerald-300 transition-colors">
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-4">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                    Autentikasi Aman & Modern
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Sistem pendaftaran dan login terlindungi dengan hashing kata sandi Bcrypt serta JWT session cookie HTTP-only.
                  </p>
                  <div className="mt-4">
                    <Badge variant="success">Tersedia di Tahap 1</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:border-emerald-300 transition-colors">
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center mb-4">
                    <Database className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                    PostgreSQL & Prisma ORM
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Skema database relational yang terstruktur rapi, siap untuk ekspansi pencatatan transaksi di tahap berikutnya.
                  </p>
                  <div className="mt-4">
                    <Badge variant="success">Tersedia di Tahap 1</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:border-emerald-300 transition-colors">
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-4">
                    <BarChart2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                    Manajemen Transaksi
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Pencatatan pemasukan, pengeluaran, kategori transaksi kustom, dan grafik tren pengeluaran bulanan.
                  </p>
                  <div className="mt-4">
                    <Badge variant="neutral">Direncanakan di Tahap 2</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Tech Stack Banner */}
        <section id="architecture" className="py-16 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Teknologi yang Digunakan
            </h3>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-sm font-medium text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Next.js App Router</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <Zap className="w-4 h-4 text-teal-600" />
                <span>TypeScript</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>Tailwind CSS</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <Database className="w-4 h-4 text-blue-600" />
                <span>PostgreSQL & Prisma</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-950 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4">
          <p>© {new Date().getFullYear()} Expense Tracker App — Tahap 1: Fondasi, Autentikasi, Database, & Layout.</p>
        </div>
      </footer>
    </div>
  );
}
