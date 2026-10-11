"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { UserProfileModal } from "@/components/dashboard/UserProfileModal";
import { SafeUser } from "@/types";

interface DashboardShellProps {
  user: SafeUser;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  let pageTitle = "Dashboard";
  let pageSubtitle = "Overview & Status Finansial";

  if (pathname.startsWith("/transactions")) {
    pageTitle = "Transaksi";
    pageSubtitle = "Kelola catatan pemasukan dan pengeluaran";
  } else if (pathname.startsWith("/reports")) {
    pageTitle = "Laporan";
    pageSubtitle = "Ringkasan dan ekspor laporan keuangan";
  } else if (pathname.startsWith("/budgets")) {
    pageTitle = "Anggaran";
    pageSubtitle = "Batas pengeluaran bulanan per kategori";
  } else if (pathname.startsWith("/categories")) {
    pageTitle = "Kategori";
    pageSubtitle = "Kelola kategori transaksi keuangan Anda";
  } else if (pathname.startsWith("/settings")) {
    pageTitle = "Pengaturan";
    pageSubtitle = "Profil, password, dan keamanan akun";
  }

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
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          title={pageTitle}
          subtitle={pageSubtitle}
          user={user}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenProfile={() => setProfileModalOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
      />
    </div>
  );
}
