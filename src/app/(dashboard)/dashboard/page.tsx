import { getCurrentUser } from "@/lib/auth";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Database, ShieldCheck, CheckCircle2, Calendar } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const currentDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Halo, {user?.name || "Pengguna"} 👋
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Berikut adalah ringkasan kondisi keuangan pribadi Anda hari ini.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl w-fit">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>{currentDate}</span>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ringkasan Saldo & Alur Kas
          </h3>
          <Badge variant="neutral">Placeholder Tahap 1</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Saldo"
            value="Rp 0"
            description="Akumulasi saldo kas dan rekening aktif Anda."
            type="balance"
            badgeText="Rp 0"
          />

          <StatCard
            title="Pemasukan"
            value="Rp 0"
            description="Total pemasukan tercatat bulan ini."
            type="income"
            badgeText="Bulan Ini"
          />

          <StatCard
            title="Pengeluaran"
            value="Rp 0"
            description="Total pengeluaran tercatat bulan ini."
            type="expense"
            badgeText="Bulan Ini"
          />

          <StatCard
            title="Estimasi Tabungan"
            value="Rp 0"
            description="Selisih surplus kas yang dapat ditabung."
            type="savings"
            badgeText="Target: 20%"
          />
        </div>
      </section>

      {/* Main Empty State & Transactions Area */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Riwayat Transaksi Terbaru
          </h3>
        </div>

        <EmptyState />
      </section>

      {/* System Readiness & Phase 2 Checklist */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Fondasi Tahap 1 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Fondasi Sistem & Keamanan (Tahap 1)
              </CardTitle>
              <Badge variant="success">Selesai</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 dark:text-slate-200">Autentikasi Terproteksi:</strong>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Register, login, dan logout dengan bcrypt hash dan cookie JWT httpOnly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 dark:text-slate-200">Database & ORM:</strong>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  PostgreSQL terintegrasi dengan skema Prisma User yang tervalidasi.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 dark:text-slate-200">Arsitektur Modular:</strong>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Komponen UI reusable (Button, Input, Card, Modal, Alert, Avatar, Badge).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roadmap Tahap 2 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-600" />
                Roadmap Pengembangan (Tahap 2)
              </CardTitle>
              <Badge variant="neutral">Berikutnya</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3 text-slate-500">
              <span className="h-4 w-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                1
              </span>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Pencatatan Transaksi (Income & Expense)
                </span>
                <p className="text-xs text-slate-400">
                  Model Transaction dengan nominal, tipe, tanggal, dan deskripsi.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-slate-500">
              <span className="h-4 w-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                2
              </span>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Pengelolaan Kategori
                </span>
                <p className="text-xs text-slate-400">
                  Kategori custom dengan icon dan warna pilihan.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-slate-500">
              <span className="h-4 w-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                3
              </span>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Grafik & Laporan Keuangan
                </span>
                <p className="text-xs text-slate-400">
                  Visualisasi perbandingan pengeluaran dan ringkasan bulanan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
