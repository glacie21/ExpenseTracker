"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Tags,
  BarChart3,
  PiggyBank,
  Settings,
  X,
  LogOut,
} from "lucide-react";
import { Wordmark } from "@/components/layout/Wordmark";
import { SafeUser } from "@/types";

interface SidebarProps {
  user?: SafeUser | null;
  isOpen?: boolean;
  onClose?: () => void;
  onLogout?: () => void;
}

const NAVIGATION = [
  { name: "Ringkasan", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transaksi", href: "/transactions", icon: Receipt },
  { name: "Anggaran", href: "/budgets", icon: PiggyBank },
  { name: "Laporan", href: "/reports", icon: BarChart3 },
  { name: "Kategori", href: "/categories", icon: Tags },
  { name: "Pengaturan", href: "/settings", icon: Settings },
];

export function Sidebar({ user, isOpen = false, onClose, onLogout }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-rule bg-paper transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <Wordmark href="/dashboard" />

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm p-1 text-ink-3 hover:bg-sunken hover:text-ink lg:hidden"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menu utama">
          <ul className="space-y-0.5">
            {NAVIGATION.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-surface font-medium text-ink shadow-[inset_2px_0_0_var(--ink)]"
                        : "text-ink-2 hover:bg-sunken hover:text-ink"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-ink" : "text-ink-3"}`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {user && (
          <div className="flex items-center justify-between gap-2 border-t border-rule px-6 py-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{user.name}</p>
              <p className="truncate text-xs text-ink-3">{user.email}</p>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Keluar"
                aria-label="Keluar"
                className="shrink-0 rounded-sm p-1.5 text-ink-3 transition-colors hover:bg-sunken hover:text-neg"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
