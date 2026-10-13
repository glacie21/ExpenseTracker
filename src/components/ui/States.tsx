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
    <section role="alert" className={`rounded-sm border border-rule bg-surface px-6 py-12 text-center ${className}`}>
      <h2 className="font-serif text-lg text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-5">
          Coba lagi
        </Button>
      )}
    </section>
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
    <section className="rounded-sm border border-dashed border-rule px-6 py-12 text-center sm:py-16">
      <h2 className="font-serif text-xl text-ink">{title}</h2>
      {children && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-2">{children}</p>}
      {action && <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </section>
  );
}
