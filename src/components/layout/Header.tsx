"use client";

import React from "react";
import { Menu, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SafeUser } from "@/types";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  user?: SafeUser | null;
  onOpenSidebar: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export function Header({
  title = "Dashboard",
  subtitle = "Overview & Status Finansial",
  user,
  onOpenSidebar,
  onOpenProfile,
  onLogout,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right: User Profile & Actions */}
      <div className="flex items-center gap-3">
        {user && (
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 rounded-full p-1 sm:pr-3 text-left hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <Avatar name={user.name || "User"} size="sm" />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-400">Lihat Profil</span>
            </div>
          </button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          leftIcon={<LogOut className="h-4 w-4" />}
          className="text-slate-600 hover:text-rose-600 hover:border-rose-200 dark:hover:text-rose-400"
        >
          <span className="hidden sm:inline">Keluar</span>
        </Button>
      </div>
    </header>
  );
}
