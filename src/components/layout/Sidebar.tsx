"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Tags,
  BarChart3,
  Settings,
  Wallet,
  Lock,
  X,
  LogOut,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { SafeUser } from "@/types";

interface SidebarProps {
  user?: SafeUser | null;
  isOpen?: boolean;
  onClose?: () => void;
  onLogout?: () => void;
}

interface NavItemConfig {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  badge?: string;
}

export function Sidebar({ user, isOpen = false, onClose, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const navigation: NavItemConfig[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      disabled: false,
    },
    {
      name: "Transactions",
      href: "/transactions",
      icon: Receipt,
      disabled: false,
    },
    {
      name: "Categories",
      href: "/categories",
      icon: Tags,
      disabled: false,
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
      disabled: false,
    },
    {
      name: "Settings",
      href: "#",
      icon: Settings,
      disabled: true,
      badge: "Segera",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200/80 bg-white shadow-sm transition-transform duration-300 dark:border-slate-800 dark:bg-slate-950 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800/80">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm shadow-emerald-500/20">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base leading-tight tracking-tight text-slate-900 dark:text-white">
                Expense<span className="text-emerald-600">Tracker</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider">
                PERSONAL FINANCE
              </span>
            </div>
          </Link>

          {/* Close button on mobile */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:hover:bg-slate-800"
              aria-label="Tutup sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-6">
          <div className="space-y-1.5">
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Menu Navigasi
            </div>

            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href && !item.disabled;

              if (item.disabled) {
                return (
                  <div
                    key={item.name}
                    className="group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 cursor-not-allowed select-none transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    title={`${item.name} akan segera tersedia`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        <Lock className="w-2.5 h-2.5" />
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 shadow-sm font-semibold dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 ${
                        isActive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-400"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Phase 2 Status Banner */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
            <div className="flex items-center gap-2 font-semibold">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Data Tersinkron
            </div>
            <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300/80 leading-relaxed">
              Transaksi, Kategori, dan Ringkasan Finansial tersinkronisasi langsung ke database.
            </p>
          </div>
        </div>

        {/* User Mini Profile & Logout */}
        {user && (
          <div className="border-t border-slate-100 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <Avatar name={user.name || "User"} size="sm" />
                <div className="flex flex-col truncate">
                  <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {user.name}
                  </span>
                  <span className="truncate text-[11px] text-slate-400">
                    {user.email}
                  </span>
                </div>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Logout"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
