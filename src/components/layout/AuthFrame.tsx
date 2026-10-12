import React from "react";
import { Wordmark } from "@/components/layout/Wordmark";

interface AuthFrameProps {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}

/** Shared frame for the login and register pages. */
export function AuthFrame({ title, subtitle, footer, children }: AuthFrameProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-rule px-4 py-5 sm:px-8">
        <Wordmark />
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-12 sm:py-20">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-3xl font-medium text-ink">{title}</h1>
          <p className="mt-2 text-sm text-ink-2">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <p className="mt-8 border-t border-rule pt-5 text-sm text-ink-2">{footer}</p>
        </div>
      </main>
    </div>
  );
}
