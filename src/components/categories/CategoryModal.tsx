"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Category, TransactionType } from "@/types";
import { Check } from "lucide-react";

export interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Category | null;
  defaultType?: TransactionType;
}

const PRESET_COLORS = [
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f43f5e", // rose
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // amber
  "#14b8a6", // teal
  "#64748b", // slate
];

export function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultType = "EXPENSE",
}: CategoryModalProps) {
  const isEditing = Boolean(initialData);

  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>(defaultType);
  const [color, setColor] = useState("#10b981");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setApiError(null);
      setIsSubmitting(false);

      if (initialData) {
        setName(initialData.name);
        setType(initialData.type);
        setColor(initialData.color || "#10b981");
      } else {
        setName("");
        setType(defaultType || "EXPENSE");
        setColor(defaultType === "INCOME" ? "#10b981" : "#f97316");
      }
    }
  }, [isOpen, initialData, defaultType]);

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
      title={isEditing ? "Edit Kategori" : "Tambah Kategori Baru"}
      description={
        isEditing
          ? "Perbarui nama dan warna penanda kategori."
          : "Tambahkan kategori baru untuk transaksi Anda."
      }
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <Alert variant="error" title="Gagal Menyimpan">
            {apiError}
          </Alert>
        )}

        {/* Tipe Kategori */}
        {!isEditing && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Tipe Kategori
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType("INCOME");
                  setColor("#10b981");
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  type === "INCOME"
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                Pemasukan (Income)
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("EXPENSE");
                  setColor("#f97316");
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  type === "EXPENSE"
                    ? "bg-rose-500 text-white border-rose-600 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                Pengeluaran (Expense)
              </button>
            </div>
          </div>
        )}

        <Input
          label="Nama Kategori"
          placeholder="Contoh: Kebutuhan Rumah, Hobi, Bonus"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
          }}
          error={errors.name}
          required
        />

        {/* Color Picker Palette */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Warna Penanda
          </label>
          <div className="flex flex-wrap gap-2.5 items-center">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-8 w-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm"
                style={{ backgroundColor: c }}
                title={c}
              >
                {color.toLowerCase() === c.toLowerCase() && (
                  <Check className="w-4 h-4 text-white drop-shadow" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
            {isEditing ? "Simpan Perubahan" : "Tambah Kategori"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
