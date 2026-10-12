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

  let pageTitle = "Ringkasan";
  let pageSubtitle = "Kondisi keuangan Anda pada periode yang dipilih";

  if (pathname.startsWith("/transactions")) {
    pageTitle = "Transaksi";
    pageSubtitle = "Semua pemasukan dan pengeluaran yang tercatat";
  } else if (pathname.startsWith("/reports")) {
    pageTitle = "Laporan";
    pageSubtitle = "Ringkasan per periode, siap diunduh";
  } else if (pathname.startsWith("/budgets")) {
    pageTitle = "Anggaran";
    pageSubtitle = "Batas pengeluaran bulanan per kategori";
  } else if (pathname.startsWith("/categories")) {
    pageTitle = "Kategori";
    pageSubtitle = "Pengelompokan untuk transaksi dan anggaran";
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
    <div className="flex min-h-screen flex-col bg-paper lg:flex-row">
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
        />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
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
