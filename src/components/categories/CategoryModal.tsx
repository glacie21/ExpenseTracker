"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Category, TransactionType } from "@/types";
import { Check } from "lucide-react";
import { FIELD_LABEL } from "@/components/ui/fieldStyles";
import { TypeToggle } from "@/components/ui/TypeToggle";

export interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Category | null;
  defaultType?: TransactionType;
}

// Muted inks that stay readable as small dots on both the light and dark paper
const PRESET_COLORS = [
  { value: "#2b67a8", name: "Biru" },
  { value: "#5f8fb8", name: "Biru muda" },
  { value: "#3d8a8a", name: "Hijau laut" },
  { value: "#4f7d3a", name: "Hijau" },
  { value: "#8a9a2b", name: "Zaitun" },
  { value: "#b8892b", name: "Kuning tanah" },
  { value: "#c4532b", name: "Jingga" },
  { value: "#a8324a", name: "Merah tua" },
  { value: "#8a4f9e", name: "Ungu" },
  { value: "#5b5fa8", name: "Nila" },
  { value: "#7a6a55", name: "Cokelat" },
  { value: "#75716a", name: "Abu-abu" },
];

const DEFAULT_COLOR = { INCOME: "#2b67a8", EXPENSE: "#c4532b" } as const;

export function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultType = "EXPENSE",
}: CategoryModalProps) {
  const isEditing = Boolean(initialData);

  // State diinisialisasi dari props; parent memberi `key` baru setiap form dibuka
  const [name, setName] = useState(initialData?.name ?? "");
  const [type, setType] = useState<TransactionType>(initialData?.type ?? defaultType);
  const [color, setColor] = useState(
    initialData?.color || DEFAULT_COLOR[defaultType]
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      setErrors({ name: "Nama kategori wajib diisi" });
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const url = isEditing
        ? `/api/categories/${initialData?.id}`
        : "/api/categories";
      const method = isEditing ? "PUT" : "POST";

      const payload = isEditing
        ? { name: name.trim(), color }
        : { name: name.trim(), type, color };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        if (json.errors) {
          setErrors(json.errors);
        }
        setApiError(json.message || "Gagal menyimpan kategori.");
        setIsSubmitting(false);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setApiError("Terjadi kesalahan koneksi. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={isEditing ? "Ubah kategori" : "Tambah kategori"}
      description={isEditing ? "Tipe kategori tidak bisa diubah setelah dibuat." : undefined}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <Alert variant="error">
            {apiError}
          </Alert>
        )}

        {/* Tipe Kategori */}
        {!isEditing && (
          <TypeToggle
            value={type}
            onChange={(t) => {
              setType(t);
              setColor(DEFAULT_COLOR[t]);
            }}
            legend="Tipe kategori"
          />
        )}

        <Input
          label="Nama"
          placeholder={type === "EXPENSE" ? "Contoh: Kebutuhan rumah" : "Contoh: Bonus"}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
          }}
          error={errors.name}
          maxLength={50}
          required
        />

        {/* Color Picker Palette */}
        <fieldset>
          <legend className={FIELD_LABEL}>Warna penanda</legend>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_COLORS.map((c) => {
              const selected = color.toLowerCase() === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  aria-pressed={selected}
                  aria-label={c.name}
                  title={c.name}
                  className={`flex h-7 w-7 items-center justify-center rounded-full ring-offset-2 ring-offset-surface transition-shadow ${
                    selected ? "ring-2 ring-ink" : "hover:ring-1 hover:ring-ink-3"
                  }`}
                  style={{ backgroundColor: c.value }}
                >
                  {selected && <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex items-center justify-end gap-2 border-t border-rule-soft pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isEditing ? "Simpan perubahan" : "Simpan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
