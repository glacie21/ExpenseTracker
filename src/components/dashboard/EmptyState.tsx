import React from "react";
import { EmptyBlock } from "@/components/ui/States";
import { QuickActions } from "@/components/dashboard/QuickActions";

export function EmptyState() {
  return (
    <EmptyBlock title="Buku kas Anda masih kosong" action={<QuickActions />}>
      Catat pemasukan atau pengeluaran pertama Anda. Ringkasan, grafik, dan anggaran akan terisi dari transaksi
      yang tersimpan.
    </EmptyBlock>
  );
}
