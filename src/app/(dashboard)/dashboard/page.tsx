import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/dashboard";
import { getDashboardAnalytics, resolvePeriodFromParams } from "@/lib/analytics";
import { formatRupiah } from "@/lib/formatters";
import { formatPercent } from "@/lib/finance";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { PeriodFilter } from "@/components/dashboard/PeriodFilter";
import { TrendLine } from "@/components/dashboard/TrendLine";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { ExpenseBreakdown } from "@/components/charts/ExpenseBreakdown";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArrowDownLeft, ArrowUpRight, Calendar, List } from "lucide-react";

interface DashboardPageProps {
  searchParams: Promise<{ period?: string; start?: string; end?: string }>;
}

const GRANULARITY_LABEL = { day: "per hari", week: "per minggu", month: "per bulan" } as const;

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const { valid: validPeriod, period } = resolvePeriodFromParams(params);

  const currentDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Jakarta",
  });

  let analytics: Awaited<ReturnType<typeof getDashboardAnalytics>> | null = null;
  let overall: Awaited<ReturnType<typeof getDashboardSummary>> | null = null;
  if (user) {
    try {
      [analytics, overall] = await Promise.all([
        getDashboardAnalytics(user.id, period),
        getDashboardSummary(user.id),
      ]);
    } catch (error) {
      console.error("Dashboard analytics error:", error);
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
            {overall && (
              <>
                {" "}
                Saldo bersih seluruh transaksi:{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatRupiah(overall.summary.totalBalance)}
                </span>
                .
              </>
            )}
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

      <PeriodFilter
        preset={period.preset}
        start={period.start}
        end={period.end}
        label={period.label}
      >
        {!validPeriod && (params.period || params.start || params.end) && (
          <Alert variant="warning" className="mb-6">
            Periode yang diminta tidak valid, menampilkan bulan ini.
          </Alert>
        )}

        {!analytics || !overall ? (
          <Alert variant="error" title="Gagal memuat data">
            Ringkasan keuangan tidak dapat dimuat saat ini. Silakan muat ulang halaman beberapa saat
            lagi.
          </Alert>
        ) : (
          <div className="space-y-8">
            {/* Financial Summary */}
            <section aria-labelledby="summary-heading">
              <h3
                id="summary-heading"
                className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                Ringkasan Periode
              </h3>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                Perbandingan terhadap {period.previousLabel}.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard
                  title="Total Income"
                  value={formatRupiah(analytics.summary.totalIncome)}
                  description="Jumlah seluruh pemasukan pada periode ini."
                  type="income"
                  badgeText={`${analytics.summary.incomeCount} transaksi`}
                  footer={<TrendLine {...analytics.trends.income} increaseIsGood />}
                />
                <StatCard
                  title="Total Expense"
                  value={formatRupiah(analytics.summary.totalExpense)}
                  description="Jumlah seluruh pengeluaran pada periode ini."
                  type="expense"
                  badgeText={`${analytics.summary.expenseCount} transaksi`}
                  footer={<TrendLine {...analytics.trends.expense} increaseIsGood={false} />}
                />
                <StatCard
                  title="Net Balance"
                  value={formatRupiah(analytics.summary.netBalance)}
                  description="Pemasukan dikurangi pengeluaran pada periode ini."
                  type="balance"
                  badgeText={analytics.summary.netBalance < 0 ? "Defisit" : "Surplus"}
                  footer={<TrendLine {...analytics.trends.netBalance} increaseIsGood />}
                />
                <StatCard
                  title="Savings Rate"
                  value={formatPercent(analytics.summary.savingsRate)}
                  description={
                    analytics.summary.totalIncome > 0
                      ? "Porsi pemasukan yang tersisa setelah pengeluaran."
                      : "0% karena belum ada pemasukan pada periode ini."
                  }
                  type="savings"
                />
              </div>
            </section>

            {/* Charts */}
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
              <Card className="xl:col-span-3">
                <CardHeader>
                  <CardTitle className="text-base">Income vs Expense</CardTitle>
                  <CardDescription>
                    Pemasukan dan pengeluaran {GRANULARITY_LABEL[analytics.granularity]}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <IncomeExpenseChart series={analytics.series} granularity={analytics.granularity} />
                </CardContent>
              </Card>

              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Expense Breakdown</CardTitle>
                  <CardDescription>Distribusi pengeluaran per kategori.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpenseBreakdown items={analytics.breakdown} />
                </CardContent>
              </Card>
            </section>

            {/* Recent Transactions (all periods) */}
            <section className="space-y-4">
              {overall.recentTransactions.length === 0 ? (
                <EmptyState />
              ) : (
                <RecentTransactions transactions={overall.recentTransactions} />
              )}
            </section>
          </div>
        )}
      </PeriodFilter>
    </div>
  );
}
