import { getCurrentUser } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/dashboard";
import { getDashboardAnalytics, resolvePeriodFromParams } from "@/lib/analytics";
import { PeriodStatement } from "@/components/dashboard/PeriodStatement";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { PeriodFilter } from "@/components/dashboard/PeriodFilter";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { ExpenseBreakdown } from "@/components/charts/ExpenseBreakdown";
import { Alert } from "@/components/ui/Alert";
import { Amount } from "@/components/ui/Amount";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

interface DashboardPageProps {
  searchParams: Promise<{ period?: string; start?: string; end?: string }>;
}

const GRANULARITY_LABEL = { day: "per hari", week: "per minggu", month: "per bulan" } as const;

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const { valid: validPeriod, period } = resolvePeriodFromParams(params);

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
    <PeriodFilter
      preset={period.preset}
      start={period.start}
      end={period.end}
      label={period.label}
      actions={<QuickActions />}
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <PeriodStatement
                income={analytics.summary.totalIncome}
                expense={analytics.summary.totalExpense}
                incomeCount={analytics.summary.incomeCount}
                expenseCount={analytics.summary.expenseCount}
                savingsRate={analytics.summary.savingsRate}
                trends={analytics.trends}
                previousLabel={period.previousLabel}
              />
            </div>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Arus kas</CardTitle>
                <CardDescription>
                  Pemasukan dan pengeluaran {GRANULARITY_LABEL[analytics.granularity]}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IncomeExpenseChart series={analytics.series} granularity={analytics.granularity} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Pengeluaran per kategori</CardTitle>
                <CardDescription>Diurutkan dari yang terbesar.</CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseBreakdown items={analytics.breakdown} />
              </CardContent>
            </Card>

            <div className="lg:col-span-3">
              {overall.recentTransactions.length === 0 ? (
                <EmptyState />
              ) : (
                <RecentTransactions transactions={overall.recentTransactions} />
              )}
            </div>
          </div>

          <p className="border-t border-rule pt-4 text-sm text-ink-3">
            Saldo dari seluruh catatan sejak awal:{" "}
            <Amount value={overall.summary.totalBalance} className="text-base" />. Ini selisih
            transaksi yang tercatat, bukan saldo rekening bank.
          </p>
        </div>
      )}
    </PeriodFilter>
  );
}
