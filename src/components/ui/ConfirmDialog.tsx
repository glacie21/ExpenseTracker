"use client";

import React, { useId } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: "danger" | "warning";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Ya, Hapus",
  cancelLabel = "Batal",
  isLoading = false,
  variant = "danger",
}: ConfirmDialogProps) {
  const titleId = useId();
  const messageId = useId();
  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      maxWidth="sm"
      labelledBy={titleId}
      describedBy={messageId}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <AlertTriangle
            className={`h-5 w-5 shrink-0 ${variant === "danger" ? "text-neg" : "text-warn"}`}
            aria-hidden="true"
          />
          <h4 id={titleId} className="font-serif text-lg font-medium text-ink">
            {title}
          </h4>
        </div>

        <p id={messageId} className="text-sm text-ink-2 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-rule-soft">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
