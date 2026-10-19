"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard, PiggyBank, Plus, Receipt, Settings, Tags } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { buttonStyles } from "@/components/ui/Button";
import { Wordmark } from "@/components/layout/Wordmark";
import { SafeUser } from "@/types";

const NAVIGATION = [
  { name: "Ringkasan", href: "/dashboard", icon: LayoutDashboard, mobile: true },
  { name: "Transaksi", href: "/transactions", icon: Receipt, mobile: true },
  { name: "Anggaran", href: "/budgets", icon: PiggyBank, mobile: true },
  { name: "Laporan", href: "/reports", icon: BarChart3, mobile: true },
  { name: "Kategori", href: "/categories", icon: Tags, mobile: false },
  { name: "Pengaturan", href: "/settings", icon: Settings, mobile: false },
];

const ADD_HREF = "/transactions?add=EXPENSE";

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

/** Sticky top bar: section links on desktop, wordmark and profile everywhere. */
export function TopBar({ user, onOpenProfile }: { user: SafeUser; onOpenProfile: () => void }) {
  const isActive = useIsActive();

  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-8">
        <Wordmark href="/dashboard" />

        <nav className="hidden flex-1 lg:block" aria-label="Menu utama">
          <ul className="flex items-center gap-1">
            {NAVIGATION.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                      active ? "bg-accent-soft font-medium text-accent" : "text-ink-2 hover:bg-sunken hover:text-ink"
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link href={ADD_HREF} className={`max-lg:hidden ${buttonStyles("primary", "md")}`}>
            <Plus className="h-4 w-4" />
            Catat transaksi
          </Link>
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex shrink-0 items-center gap-2.5 rounded-full p-0.5 text-left transition-colors hover:bg-sunken xl:pr-3"
            aria-label="Buka profil dan menu akun"
          >
            <Avatar name={user.name || "Pengguna"} size="sm" />
            <span className="hidden max-w-32 truncate text-sm text-ink-2 xl:inline">{user.name}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

/** Bottom tab bar on phones, with the record button raised in the middle. */
export function BottomNav() {
  const isActive = useIsActive();
  const items = NAVIGATION.filter((item) => item.mobile);
  const left = items.slice(0, 2);
  const right = items.slice(2);

  const renderItem = (item: (typeof NAVIGATION)[number]) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <li key={item.href} className="flex-1">
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={`flex flex-col items-center gap-1 py-2 text-[11px] ${
            active ? "font-medium text-accent" : "text-ink-3"
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
          {item.name}
        </Link>
      </li>
    );
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Menu utama"
    >
      <ul className="mx-auto flex max-w-md items-end px-2">
        {left.map(renderItem)}
        <li className="flex-1">
          <Link href={ADD_HREF} className="flex flex-col items-center gap-1 pb-2 text-[11px] font-medium text-ink">
            <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-on-accent shadow-[0_8px_20px_-8px_rgb(13_92_80/0.7)]">
              <Plus className="h-6 w-6" />
            </span>
            Catat
          </Link>
        </li>
        {right.map(renderItem)}
      </ul>
    </nav>
  );
}
