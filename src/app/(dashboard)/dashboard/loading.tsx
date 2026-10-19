export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat dashboard">
      <div className="flex gap-5 border-b border-rule pb-2.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-4 w-20 animate-pulse rounded-lg bg-sunken" />
        ))}
      </div>
      <div className="h-8 w-56 animate-pulse rounded-lg bg-sunken" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="h-80 animate-pulse rounded-2xl border border-rule bg-surface lg:col-span-2" />
        <div className="h-80 animate-pulse rounded-2xl border border-rule bg-surface lg:col-span-3" />
      </div>
    </div>
  );
}
