"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BottomNav, NAVIGATION, TopBar } from "@/components/layout/AppNav";
import { UserProfileModal } from "@/components/dashboard/UserProfileModal";
import { SafeUser } from "@/types";

interface DashboardShellProps {
  user: SafeUser;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Any other path falls back to the first section, Ringkasan
  const page = NAVIGATION.find((p) => pathname.startsWith(p.href)) ?? NAVIGATION[0];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <TopBar user={user} onOpenProfile={() => setProfileModalOpen(true)} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 sm:px-8 sm:pt-10 lg:pb-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{page.name}</h1>
          <p className="mt-1 text-sm text-ink-2">{page.subtitle}</p>
        </div>
        {children}
      </main>

      <BottomNav />

      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onLogout={handleLogout}
        user={user}
      />
    </div>
  );
}
