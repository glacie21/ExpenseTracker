"use client";

import React from "react";
import { Menu } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { SafeUser } from "@/types";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  user?: SafeUser | null;
  onOpenSidebar: () => void;
  onOpenProfile: () => void;
}

export function Header({ title = "Ringkasan", subtitle, user, onOpenSidebar, onOpenProfile }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-4 border-b border-rule bg-paper px-4 sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-sm p-1.5 text-ink-2 hover:bg-sunken hover:text-ink lg:hidden"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <h1 className="truncate font-serif text-xl font-medium text-ink">{title}</h1>
          {subtitle && <p className="hidden truncate text-xs text-ink-3 sm:block">{subtitle}</p>}
        </div>
      </div>

      {user && (
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex shrink-0 items-center gap-2.5 rounded-full p-0.5 text-left transition-colors hover:bg-sunken sm:pr-3"
          aria-label="Lihat profil"
        >
          <Avatar name={user.name || "Pengguna"} size="sm" />
          <span className="hidden text-sm text-ink-2 sm:inline">{user.name}</span>
        </button>
      )}
    </header>
  );
}
