"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText, FileType, Table2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type ExportFormat = "pdf" | "xlsx" | "docx" | "csv";

const OPTIONS: { value: ExportFormat; label: string; hint: string; icon: React.ElementType }[] = [
  { value: "pdf", label: "PDF", hint: "Siap dicetak atau dibagikan", icon: FileText },
  { value: "xlsx", label: "Excel (.xlsx)", hint: "Ringkasan, kategori, dan transaksi per sheet", icon: FileSpreadsheet },
  { value: "docx", label: "Word (.docx)", hint: "Dokumen yang masih bisa Anda edit", icon: FileType },
  { value: "csv", label: "CSV", hint: "Data transaksi mentah untuk aplikasi lain", icon: Table2 },
];

interface ExportMenuProps {
  onSelect: (format: ExportFormat) => void;
  /** The format being downloaded, if any. */
  exporting: ExportFormat | null;
  disabled?: boolean;
}

/** "Unduh laporan" button that opens a list of file formats. */
export function ExportMenu({ onSelect, exporting, disabled = false }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[0]?.focus();
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const items = itemRefs.current.filter((el): el is HTMLButtonElement => el !== null);
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      items[(index + step + items.length) % items.length]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      items[e.key === "Home" ? 0 : items.length - 1]?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const busyLabel = OPTIONS.find((o) => o.value === exporting)?.label;

  return (
    <div ref={rootRef} className="relative">
      <Button
        ref={buttonRef}
        variant="primary"
        onClick={() => setOpen((v) => !v)}
        isLoading={exporting !== null}
        disabled={disabled || exporting !== null}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        leftIcon={<Download className="h-4 w-4" />}
        rightIcon={<ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />}
      >
        {busyLabel ? `Menyiapkan ${busyLabel}` : "Unduh laporan"}
      </Button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Pilih format file"
          onKeyDown={onMenuKeyDown}
          className="absolute left-0 z-20 mt-2 w-72 md:right-0 md:left-auto max-w-[calc(100vw-2rem)] rounded-2xl border border-rule bg-surface p-1.5 shadow-[0_16px_40px_-16px_rgb(6_30_25/0.35)]"
        >
          {OPTIONS.map((option, i) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSelect(option.value);
                }}
                className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-sunken focus-visible:bg-sunken focus-visible:outline-none"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-ink">{option.label}</span>
                  <span className="block text-xs text-ink-3">{option.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
