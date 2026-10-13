"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { formatRupiah } from "@/lib/formatters";
import { normalizeAmount } from "@/lib/validations";
import { Category } from "@/types";
import { FIELD, FIELD_LABEL } from "@/components/ui/fieldStyles";

export interface BudgetFormData {
  id?: string;
  categoryId: string;
  amount: number | string;
  month: number;
  year: number;
}

interface BudgetModalProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
  initialData: BudgetFormData;
  categories: Category[];
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** Create/edit a monthly budget. Parent mounts it with a fresh `key` per open. */
export function BudgetModal({ onClose, onSuccess, initialData, categories }: BudgetModalProps) {
  const isEditing = Boolean(initialData.id);
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  const [categoryId, setCategoryId] = useState(initialData.categoryId || expenseCategories[0]?.id || "");
  const [amount, setAmount] = useState(initialData.amount ? String(initialData.amount) : "");
  const [month, setMonth] = useState(initialData.month);
  const [year, setYear] = useState(String(initialData.year));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category list may finish loading after the modal opened
  const effectiveCategoryId = expenseCategories.some((c) => c.id === categoryId)
    ? categoryId
    : (expenseCategories[0]?.id ?? "");

  const validate = () => {
    const next: Record<string, string> = {};
    if (!effectiveCategoryId) next.categoryId = "Kategori pengeluaran wajib dipilih";
    const num = parseFloat(amount);
    if (!amount.trim() || isNaN(num)) next.amount = "Nominal anggaran wajib diisi";
    else if (num <= 0) next.amount = "Nominal anggaran harus lebih besar dari Rp0";
    else if (normalizeAmount(amount) === null) next.amount = "Maksimal 13 digit dengan 2 angka desimal";
    const y = Number(year);
    if (!Number.isInteger(y) || y < 2000 || y > 2100) next.year = "Tahun harus antara 2000 dan 2100";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !validate()) return;

    setIsSubmitting(true);
    setApiError(null);
    try {
      const res = await fetch(isEditing ? `/api/budgets/${initialData.id}` : "/api/budgets", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: effectiveCategoryId,
          amount: amount.trim(),
          month,
          year: Number(year),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.errors) setErrors(json.errors);
        setApiError(json.message || "Gagal menyimpan anggaran.");
        return;
      }
      onSuccess(json.message);
      onClose();
    } catch {
      setApiError("Terjadi gangguan jaringan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={isSubmitting ? () => {} : onClose}
      title={isEditing ? "Ubah anggaran" : "Buat anggaran"}
      description="Batas pengeluaran satu kategori untuk satu bulan."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {apiError && (
          <Alert variant="error">
            {apiError}
          </Alert>
        )}

        <div>
          <label htmlFor="budget-category" className={FIELD_LABEL}>
            Kategori pengeluaran
          </label>
          <select
            id="budget-category"
            value={effectiveCategoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={FIELD}
            aria-invalid={Boolean(errors.categoryId)}
          >
            {expenseCategories.length === 0 && <option value="">Belum ada kategori pengeluaran</option>}
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1 text-xs text-neg">{errors.categoryId}</p>}
        </div>

        <Input
          label="Batas (Rp)"
          className="num text-base"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          placeholder="Contoh: 1500000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          helperText={
            amount && parseFloat(amount) > 0 ? `Terbaca: ${formatRupiah(parseFloat(amount))}` : undefined
          }
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="budget-month" className={FIELD_LABEL}>
              Bulan
            </label>
            <select
              id="budget-month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className={FIELD}
            >
              {MONTHS.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
            {errors.month && <p className="mt-1 text-xs text-neg">{errors.month}</p>}
          </div>
          <Input
            label="Tahun"
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            error={errors.year}
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-rule-soft pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
            {isEditing ? "Simpan perubahan" : "Simpan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
