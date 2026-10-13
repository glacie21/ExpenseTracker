"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PaginatedTransactions } from "@/types";

/** Footer under a server-paginated table: the row range shown and previous/next buttons. */
export function Pagination({
  pagination,
  onPageChange,
  noun = "transaksi",
}: {
  pagination: PaginatedTransactions["pagination"];
  onPageChange: (page: number) => void;
  noun?: string;
}) {
  const { page, limit, total, totalPages } = pagination;
  const firstRow = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastRow = Math.min(page * limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-rule px-5 py-3 sm:flex-row sm:px-6">
      <p className="text-xs text-ink-3">
        <span className="num text-sm text-ink">
          {firstRow}–{lastRow}
        </span>{" "}
        dari <span className="num text-sm text-ink">{total}</span> {noun}
      </p>

      {totalPages > 1 && (
        <nav className="flex items-center gap-2" aria-label="Halaman">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            Sebelumnya
          </Button>
          <span className="px-1 text-xs text-ink-3">
            Hal. <span className="num text-sm text-ink">{page}</span> /{" "}
            <span className="num text-sm text-ink">{totalPages}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            Berikutnya
          </Button>
        </nav>
      )}
    </div>
  );
}
