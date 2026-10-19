"use client";

import React from "react";
import { Pencil, Trash2 } from "lucide-react";

/** Edit and delete icon buttons at the end of a ledger row. `label` names the row for screen readers. */
export function RowActions({
  label,
  onEdit,
  onDelete,
}: {
  label: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <span className="inline-flex shrink-0 align-top">
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Ubah ${label}`}
        title="Ubah"
        className="rounded-lg p-1.5 text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Hapus ${label}`}
        title="Hapus"
        className="rounded-lg p-1.5 text-ink-3 transition-colors hover:bg-neg-soft hover:text-neg"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </span>
  );
}
