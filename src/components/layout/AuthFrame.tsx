import React from "react";
import { Wordmark } from "@/components/layout/Wordmark";
import { Guilloche } from "@/components/ui/Guilloche";

interface AuthFrameProps {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}

/** Shared frame for the login and register pages: banknote panel beside the form. */
export function AuthFrame({ title, subtitle, footer, children }: AuthFrameProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="relative isolate hidden overflow-hidden bg-note text-note-ink lg:flex lg:w-[44%] lg:flex-col lg:justify-between lg:p-12">
        <Guilloche className="absolute inset-0 -z-10 h-full w-full text-note-line opacity-60" />
        <Wordmark onNote />
        <p className="max-w-sm font-display text-4xl leading-[1.05] font-semibold">
          Setiap rupiah tercatat, setiap bulan terbaca.
        </p>
      </aside>

      <header className="border-b border-rule px-4 py-4 sm:px-8 lg:hidden">
        <Wordmark />
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-12 sm:py-16 lg:items-center">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-4xl font-semibold text-ink">{title}</h1>
          <p className="mt-2 text-ink-2">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <p className="mt-8 border-t border-rule pt-5 text-sm text-ink-2">{footer}</p>
        </div>
      </main>
    </div>
  );
}
