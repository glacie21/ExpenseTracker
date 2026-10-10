import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/dashboard";
import { formatRupiah } from "@/lib/formatters";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ArrowDownLeft, ArrowUpRight, Calendar, List } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const currentDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Jakarta",
  });

  let data: Awaited<ReturnType<typeof getDashboardSummary>> | null = null;
  if (user) {
    try {
      data = await getDashboardSummary(user.id);
    } catch (error) {
      console.error("Dashboard summary error:", error);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Halo, {user?.name || "Pengguna"} 👋
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Berikut adalah ringkasan kondisi keuangan pribadi Anda.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl w-fit">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>{currentDate}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <section aria-label="Aksi cepat" className="flex flex-wrap gap-3">
        <Link href="/transactions?add=INCOME">
          <Button variant="primary" leftIcon={<ArrowDownLeft className="h-4 w-4" />}>
            Add Income
          </Button>
        </Link>
        <Link href="/transactions?add=EXPENSE">
          <Button variant="danger" leftIcon={<ArrowUpRight className="h-4 w-4" />}>
            Add Expense
          </Button>
        </Link>
        <Link href="/transactions">
          <Button variant="outline" leftIcon={<List className="h-4 w-4" />}>
            View Transactions
          </Button>
        </Link>
      </section>

      {!data ? (
        <Alert variant="error" title="Gagal memuat data">
          Ringkasan keuangan tidak dapat dimuat saat ini. Silakan muat ulang halaman beberapa saat
          lagi.
        </Alert>
      ) : (
        <>
          {/* Summary Stat Cards */}
          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ringkasan Keuangan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard
                title="Total Balance"
                value={formatRupiah(data.summary.totalBalance)}
                description="Pemasukan dikurangi pengeluaran dari seluruh transaksi tercatat."
                type="balance"
                badgeText={`${data.summary.totalCount} transaksi`}
              />

              <StatCard
                title="Total Income"
                value={formatRupiah(data.summary.totalIncome)}
                description="Total seluruh pemasukan yang tercatat."
                type="income"
                badgeText={`${data.summary.incomeCount} transaksi`}
              />

              <StatCard
                title="Total Expense"
                value={formatRupiah(data.summary.totalExpense)}
                description="Total seluruh pengeluaran yang tercatat."
                type="expense"
                badgeText={`${data.summary.expenseCount} transaksi`}
              />

              <StatCard
                title="Net Savings"
                value={formatRupiah(data.summary.netSavings)}
                description="Selisih pemasukan dan pengeluaran yang dapat ditabung."
                type="savings"
                badgeText={data.summary.netSavings < 0 ? "Defisit" : "Surplus"}
              />
            </div>
          </section>

          {/* Recent Transactions */}
          <section className="space-y-4">
            {data.recentTransactions.length === 0 ? (
              <EmptyState />
            ) : (
              <RecentTransactions transactions={data.recentTransactions} />
            )}
          </section>
        </>
      )}
    </div>
  );
}
