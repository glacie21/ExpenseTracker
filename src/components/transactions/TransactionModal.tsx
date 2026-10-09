"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Category, Transaction, TransactionType } from "@/types";
import { formatRupiah, formatDateForInput } from "@/lib/formatters";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

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

  const [type, setType] = useState<TransactionType>(defaultType);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(formatDateForInput(new Date()));
  const [description, setDescription] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter kategori berdasarkan tipe yang dipilih
  const filteredCategories = categories.filter((cat) => cat.type === type);

  // Sync state saat modal dibuka atau initialData berubah
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setApiError(null);
      setIsSubmitting(false);

      if (initialData) {
        setType(initialData.type);
        setTitle(initialData.title);
        setAmount(String(initialData.amount));
        setCategoryId(initialData.categoryId);
        setDate(formatDateForInput(initialData.date));
        setDescription(initialData.description || "");
      } else {
        const initialType = defaultType || "EXPENSE";
        setType(initialType);
        setTitle("");
        setAmount("");
        setDate(formatDateForInput(new Date()));
        setDescription("");

        // Set default category untuk tipe tersebut jika tersedia
        const matchingCats = categories.filter((c) => c.type === initialType);
        setCategoryId(matchingCats.length > 0 ? matchingCats[0].id : "");
      }
    }
  }, [isOpen, initialData, defaultType, categories]);

  // Saat tipe berganti, sesuaikan pilihan kategori
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setErrors((prev) => ({ ...prev, categoryId: "" }));
    const matching = categories.filter((c) => c.type === newType);
    if (!matching.some((c) => c.id === categoryId)) {
      setCategoryId(matching.length > 0 ? matching[0].id : "");
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Nama transaksi wajib diisi";
    } else if (title.trim().length < 2) {
      newErrors.title = "Nama transaksi minimal 2 karakter";
    }

    const num = parseFloat(amount);
    if (!amount || isNaN(num)) {
      newErrors.amount = "Nominal transaksi wajib diisi dengan angka valid";
    } else if (num <= 0) {
      newErrors.amount = "Nominal harus lebih besar dari Rp 0";
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
        amount: parseFloat(amount),
        categoryId,
        date: new Date(date).toISOString(),
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
      title={isEditing ? "Edit Transaksi" : "Tambah Transaksi Baru"}
      description={
        isEditing
          ? "Perbarui detail transaksi yang tercatat di akun Anda."
          : "Catat pemasukan atau pengeluaran finansial Anda."
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <Alert variant="error" title="Gagal Menyimpan">
            {apiError}
          </Alert>
        )}

        {/* Transaction Type Switcher */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Tipe Transaksi <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange("INCOME")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-semibold transition-all border ${
                type === "INCOME"
                  ? "bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/20"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
              }`}
            >
              <ArrowDownLeft className="h-4 w-4" />
              <span>Pemasukan (Income)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange("EXPENSE")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-semibold transition-all border ${
                type === "EXPENSE"
                  ? "bg-rose-500 text-white border-rose-600 shadow-sm shadow-rose-500/20"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Pengeluaran (Expense)</span>
            </button>
          </div>
        </div>

        {/* Transaction Title */}
        <Input
          label="Nama Transaksi"
          placeholder="Contoh: Gaji Bulanan, Makan Siang, Beli Kopi"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
          }}
          error={errors.title}
          required
        />

        {/* Amount */}
        <div>
          <Input
            label="Nominal (Rp)"
            type="number"
            min="1"
            step="any"
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Kategori <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                if (errors.categoryId)
                  setErrors((prev) => ({ ...prev, categoryId: "" }));
              }}
              className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-slate-900 dark:text-slate-100 ${
                errors.categoryId
                  ? "border-rose-300 focus:border-rose-500"
                  : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
              }`}
            >
              <option value="" disabled>
                -- Pilih Kategori --
              </option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-rose-500">{errors.categoryId}</p>
            )}
            {filteredCategories.length === 0 && (
              <p className="mt-1 text-xs text-amber-500">
                Belum ada kategori {type.toLowerCase()}. Silakan tambah di menu
                Kategori.
              </p>
            )}
          </div>

          <div>
            <Input
              label="Tanggal Transaksi"
              type="date"
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
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Deskripsi (Opsional)
          </label>
          <textarea
            rows={2}
            placeholder="Catatan tambahan, rincian pembelian, dll."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 resize-none"
          />
        </div>

        {/* Footer Buttons */}
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
            {isEditing ? "Simpan Perubahan" : "Tambah Transaksi"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
