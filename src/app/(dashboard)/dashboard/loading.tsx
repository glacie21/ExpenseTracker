export default function DashboardLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Memuat dashboard">
      <div className="space-y-2 pb-2">
        <div className="h-8 w-56 rounded-lg bg-slate-200 animate-pulse dark:bg-slate-800" />
        <div className="h-4 w-80 max-w-full rounded bg-slate-100 animate-pulse dark:bg-slate-800/60" />
      </div>
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-36 rounded-xl bg-slate-200 animate-pulse dark:bg-slate-800" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-36 rounded-2xl border border-slate-200/80 bg-white animate-pulse dark:border-slate-800 dark:bg-slate-900"
          />
        ))}
      </div>
      <div className="h-80 rounded-2xl border border-slate-200/80 bg-white animate-pulse dark:border-slate-800 dark:bg-slate-900" />
    </div>
  );
}
