import React from "react";
import { Button } from "@/components/ui/Button";

/** A section that could not load, with a retry button. */
export function ErrorState({
  title,
  message,
  onRetry,
  className = "",
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <section role="alert" className={`rounded-2xl border border-rule bg-surface px-6 py-12 text-center ${className}`}>
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-5">
          Coba lagi
        </Button>
      )}
    </section>
  );
}

/** Dashed placeholder where a chart would be, before there is data for it. */
export function ChartEmpty({
  icon: Icon,
  title,
  hint,
  className = "h-[260px]",
}: {
  icon: React.ElementType;
  title: string;
  hint: string;
  /** Height of the box, matching the chart it stands in for. */
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-rule text-center ${className}`}>
      <Icon className="mb-2 h-8 w-8 text-ink-3" />
      <p className="text-sm font-medium text-ink-2">{title}</p>
      <p className="mt-1 text-xs text-ink-3">{hint}</p>
    </div>
  );
}

/** Dashed placeholder for a list that has nothing in it yet. */
export function EmptyBlock({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-rule px-6 py-12 text-center sm:py-16">
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      {children && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-2">{children}</p>}
      {action && <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </section>
  );
}
