"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Category, Transaction, TransactionType } from "@/types";
import { formatRupiah, formatDateForInput } from "@/lib/formatters";
import { normalizeAmount } from "@/lib/validations";
import { latestTransactionDate, toDateOnlyString } from "@/lib/dates";
import { FIELD, FIELD_LABEL } from "@/components/ui/fieldStyles";
import { TypeToggle } from "@/components/ui/TypeToggle";

export interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Transaction | null;
  defaultType?: TransactionType;
  categories: Category[];
}

export function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultType = "EXPENSE",
  categories,
}: TransactionModalProps) {
  const isEditing = Boolean(initialData);

  // State diinisialisasi dari props; parent memberi `key` baru setiap form dibuka
  const [type, setType] = useState<TransactionType>(initialData?.type ?? defaultType);
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [amount, setAmount] = useState<string>(initialData ? String(initialData.amount) : "");
  const [chosenCategoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
  const [date, setDate] = useState(formatDateForInput(initialData?.date));
  const [description, setDescription] = useState(initialData?.description ?? "");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter kategori berdasarkan tipe yang dipilih
  const filteredCategories = categories.filter((cat) => cat.type === type);

  // Kategori terpilih harus sesuai tipe; jika belum/ tidak cocok, pakai kategori pertama.
  // Diturunkan saat render sehingga tetap benar walau kategori baru selesai dimuat.
  const categoryId = filteredCategories.some((c) => c.id === chosenCategoryId)
    ? chosenCategoryId
    : (filteredCategories[0]?.id ?? "");

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setErrors((prev) => ({ ...prev, categoryId: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Nama transaksi wajib diisi";
    } else if (title.trim().length < 2) {
      newErrors.title = "Nama transaksi minimal 2 karakter";
    }

    const num = parseFloat(amount);
    if (!amount.trim() || isNaN(num)) {
      newErrors.amount = "Nominal transaksi wajib diisi dengan angka valid";
    } else if (num <= 0) {
      newErrors.amount = "Nominal harus lebih besar dari Rp0";
    } else if (normalizeAmount(amount) === null) {
      newErrors.amount = "Nominal maksimal 13 digit dengan 2 angka desimal";
    }

    if (!categoryId) {
      newErrors.categoryId = "Kategori wajib dipilih";
    } else {
      const selectedCat = categories.find((c) => c.id === categoryId);
      if (!selectedCat || selectedCat.type !== type) {
        newErrors.categoryId = "Kategori tidak sesuai dengan tipe transaksi";
      }
    }

    if (!date) {
      newErrors.date = "Tanggal transaksi wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Mencegah submit ganda

    if (!validate()) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      const payload = {
        type,
        title: title.trim(),
        // Dikirim sebagai string desimal & tanggal kalender (YYYY-MM-DD) agar eksak
        amount: amount.trim(),
        categoryId,
        date,
        description: description.trim() || undefined,
      };

      const url = isEditing
        ? `/api/transactions/${initialData?.id}`
        : "/api/transactions";
      const method = isEditing ? "PUT" : "POST";

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
        setApiError(json.message || "Gagal menyimpan transaksi.");
        setIsSubmitting(false);
        return;
      }

      // Berhasil
      onSuccess();
      onClose();
    } catch {
      setApiError("Terjadi gangguan jaringan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={isEditing ? "Ubah transaksi" : "Catat transaksi"}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <Alert variant="error">
            {apiError}
          </Alert>
        )}

        {/* Transaction Type Switcher */}
        <TypeToggle value={type} onChange={handleTypeChange} legend="Tipe transaksi" />

        {/* Transaction Title */}
        <Input
          label="Judul"
          placeholder={type === "EXPENSE" ? "Contoh: Makan siang" : "Contoh: Gaji Oktober"}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
          }}
          error={errors.title}
          maxLength={100}
          required
        />

        {/* Amount */}
        <div>
          <Input
            label="Nominal (Rp)"
            className="num text-base"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="Contoh: 50000"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
            }}
            error={errors.amount}
            helperText={
              amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0
                ? `Terbaca: ${formatRupiah(parseFloat(amount))}`
                : undefined
            }
            required
          />
        </div>

        {/* Category & Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="transaction-category" className={FIELD_LABEL}>
              Kategori
            </label>
            <select id="transaction-category"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                if (errors.categoryId)
                  setErrors((prev) => ({ ...prev, categoryId: "" }));
              }}
              aria-invalid={errors.categoryId ? true : undefined}
              className={`${FIELD} ${errors.categoryId ? "border-neg" : ""}`}
            >
              <option value="" disabled>
                Pilih kategori
              </option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-neg">{errors.categoryId}</p>
            )}
            {filteredCategories.length === 0 && (
              <p className="mt-1 text-xs text-warn">
                Belum ada kategori {type === "INCOME" ? "pemasukan" : "pengeluaran"}. Tambahkan dulu
                di menu Kategori.
              </p>
            )}
          </div>

          <div>
            <Input
              label="Tanggal"
              type="date"
              max={toDateOnlyString(latestTransactionDate())}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                if (errors.date) setErrors((prev) => ({ ...prev, date: "" }));
              }}
              error={errors.date}
              required
            />
          </div>
        </div>

        {/* Description (Optional) */}
        <div>
          <label htmlFor="transaction-description" className={FIELD_LABEL}>
            Catatan <span className="font-normal text-ink-3">(opsional)</span>
          </label>
          <textarea id="transaction-description"
            rows={2}
            placeholder="Rincian tambahan"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            className="w-full resize-none rounded-lg border border-rule bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-3 transition-colors hover:border-ink-3 focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-neg">{errors.description}</p>
          )}
        </div>

        {/* Footer Buttons */}
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
