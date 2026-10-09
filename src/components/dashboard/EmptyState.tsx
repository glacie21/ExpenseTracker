import React from "react";
import { Receipt, Plus, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function EmptyState() {
  return (
    <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
      <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center sm:py-16">
        <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400">
          <Receipt className="h-8 w-8" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
          </span>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Belum Ada Transaksi
        </h3>
        
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Fitur pencatatan dan pengelolaan transaksi keuangan dijadwalkan akan diaktifkan pada{" "}
          <strong className="text-slate-700 dark:text-slate-200">Tahap 2</strong>. Fondasi sistem, autentikasi, dan database telah siap digunakan.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled
            leftIcon={<Plus className="w-4 h-4" />}
            className="cursor-not-allowed opacity-60"
          >
            Tambah Transaksi (Segera Hadir)
          </Button>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Fase 1: Authentication & Database Ready</span>
          </div>
        </div>

        {/* Feature roadmap preview */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl text-left">
          <div className="p-4 rounded-xl bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800/80 shadow-xs">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              01. Transaksi
            </span>
            <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
              Pemasukan & Pengeluaran
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Mencatat riwayat transaksi dengan nominal, tanggal, dan catatan.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800/80 shadow-xs">
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
              02. Kategori
            </span>
            <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
              Tag & Pengelompokan
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Klasifikasi transaksi seperti Makanan, Transportasi, Gaji, dll.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800/80 shadow-xs">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              03. Analisis
            </span>
            <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
              Grafik & Visualisasi
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Diagram alur kas bulanan dan tren rasio tabungan.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
