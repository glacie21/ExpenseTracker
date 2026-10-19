import React from "react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";

/** "Catat pengeluaran" / "Catat pemasukan" links that open the transaction form directly. */
export function QuickActions() {
  return (
    <>
      <Link href="/transactions?add=EXPENSE" className={buttonStyles("primary")}>
        Catat pengeluaran
      </Link>
      <Link href="/transactions?add=INCOME" className={buttonStyles("outline")}>
        Catat pemasukan
      </Link>
    </>
  );
}
