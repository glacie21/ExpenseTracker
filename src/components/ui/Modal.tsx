"use client";

import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Move keyboard focus into the dialog when it opens, restore it on close
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog Content */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`relative z-10 w-full outline-none ${maxWidthStyles[maxWidth]} rounded-sm border border-rule bg-surface p-6 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.35)]`}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-rule-soft">
          <div>
            {title && (
              <h3 id={titleId} className="font-serif text-xl font-medium text-ink">
                {title}
              </h3>
            )}
            {description && <p className="mt-1 text-sm text-ink-3">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1.5 rounded-sm p-1.5 text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
