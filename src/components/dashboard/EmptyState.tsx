import React from "react";
import Link from "next/link";
import { Receipt, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function EmptyState() {
  return (
    <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
      <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center sm:py-16">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400">
          <Receipt className="h-8 w-8" />
        </div>

        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Belum Ada Transaksi
        </h3>

        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Catat pemasukan atau pengeluaran pertama Anda. Ringkasan saldo akan dihitung
          otomatis dari transaksi yang tersimpan.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/transactions?add=INCOME">
            <Button variant="soft" size="sm" leftIcon={<ArrowDownLeft className="w-4 h-4" />}>
              Add Income
            </Button>
          </Link>
          <Link href="/transactions?add=EXPENSE">
            <Button variant="outline" size="sm" leftIcon={<ArrowUpRight className="w-4 h-4" />}>
              Add Expense
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
