import React from "react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";
import { addTransactionHref } from "@/lib/routes";

/** "Catat pengeluaran" / "Catat pemasukan" links that open the transaction form directly. */
export function QuickActions() {
  return (
    <>
      <Link href={addTransactionHref("EXPENSE")} className={buttonStyles("primary")}>
        Catat pengeluaran
      </Link>
      <Link href={addTransactionHref("INCOME")} className={buttonStyles("outline")}>
        Catat pemasukan
      </Link>
    </>
  );
}
