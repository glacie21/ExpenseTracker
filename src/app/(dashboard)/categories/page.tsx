"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CategoryModal } from "@/components/categories/CategoryModal";
import { Category, TransactionType } from "@/types";
import {
  Tags,
  Plus,
  Edit2,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  FolderOpen,
} from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | TransactionType>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [defaultModalType, setDefaultModalType] = useState<TransactionType>("EXPENSE");

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    category: Category | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    category: null,
    isDeleting: false,
  });

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.success && json.data?.categories) {
        setCategories(json.data.categories);
      } else {
        setFeedback({
          type: "error",
          message: json.message || "Gagal memuat kategori.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Terjadi gangguan jaringan saat memuat daftar kategori.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories =
    activeTab === "ALL"
      ? categories
      : categories.filter((c) => c.type === activeTab);

  const incomeCategories = categories.filter((c) => c.type === "INCOME");
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  const handleOpenAddModal = (type: TransactionType = "EXPENSE") => {
    setEditingCategory(null);
    setDefaultModalType(type);
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDeletePrompt = (category: Category) => {
    // Check if category is used
    const txCount = category._count?.transactions || 0;
    if (txCount > 0) {
      setFeedback({
        type: "error",
        message: `Kategori "${category.name}" sedang digunakan oleh ${txCount} transaksi. Harap ubah kategori transaksi tersebut terlebih dahulu sebelum menghapusnya.`,
      });
      return;
    }

    setDeleteDialog({
      isOpen: true,
      category,
      isDeleting: false,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.category) return;

    setDeleteDialog((prev) => ({ ...prev, isDeleting: true }));
    try {
      const res = await fetch(`/api/categories/${deleteDialog.category.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setFeedback({
          type: "success",
          message: `Kategori "${deleteDialog.category.name}" berhasil dihapus.`,
        });
        setDeleteDialog({ isOpen: false, category: null, isDeleting: false });
        fetchCategories();
      } else {
        setFeedback({
          type: "error",
          message: json.message || "Gagal menghapus kategori.",
        });
        setDeleteDialog((prev) => ({ ...prev, isDeleting: false }));
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Terjadi kesalahan jaringan saat menghapus kategori.",
      });
      setDeleteDialog((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Kelola Kategori
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Atur pengelompokan pemasukan dan pengeluaran agar pencatatan keuangan lebih terstruktur.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCategories()}
            leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />}
            title="Muat ulang kategori"
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() =>
              handleOpenAddModal(activeTab === "INCOME" ? "INCOME" : "EXPENSE")
            }
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Tambah Kategori
          </Button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <Alert
          variant={feedback.type}
          onClose={() => setFeedback(null)}
          title={feedback.type === "success" ? "Berhasil" : "Perhatian"}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "ALL"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            Semua ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("INCOME")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "INCOME"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                : "text-slate-600 hover:text-emerald-700 dark:text-slate-400"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Pemasukan ({incomeCategories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("EXPENSE")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "EXPENSE"
                ? "bg-rose-600 text-white shadow-sm shadow-rose-500/20"
                : "text-slate-600 hover:text-rose-700 dark:text-slate-400"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Pengeluaran ({expenseCategories.length})
          </button>
        </div>
      </div>

      {/* Category Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-white border border-slate-200/80 p-5 animate-pulse dark:bg-slate-900 dark:border-slate-800"
            />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 mb-4">
            <FolderOpen className="h-7 w-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Belum Ada Kategori
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Kategori membantu Anda mengelompokkan pengeluaran dan pemasukan dengan rapi.
          </p>
          <Button
            onClick={() =>
              handleOpenAddModal(activeTab === "INCOME" ? "INCOME" : "EXPENSE")
            }
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Tambah Kategori Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => {
            const isIncome = cat.type === "INCOME";
            const txCount = cat._count?.transactions || 0;

            return (
              <div
                key={cat.id}
                className="group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-4 w-4 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: cat.color || (isIncome ? "#10b981" : "#f97316") }}
                      />
                      <h4 className="font-semibold text-base text-slate-900 dark:text-slate-100 truncate">
                        {cat.name}
                      </h4>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isIncome
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                      }`}
                    >
                      {isIncome ? "Income" : "Expense"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Digunakan oleh{" "}
                    <strong className="text-slate-600 dark:text-slate-300">
                      {txCount}
                    </strong>{" "}
                    transaksi
                  </p>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleEdit(cat)}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePrompt(cat)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 rounded-lg px-2 py-1 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Modal (Add / Edit) */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSuccess={() => {
          setFeedback({
            type: "success",
            message: editingCategory
              ? "Kategori berhasil diperbarui."
              : "Kategori baru berhasil ditambahkan.",
          });
          fetchCategories();
        }}
        initialData={editingCategory}
        defaultType={defaultModalType}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({ isOpen: false, category: null, isDeleting: false })
        }
        onConfirm={handleConfirmDelete}
        title="Hapus Kategori?"
        message={`Apakah Anda yakin ingin menghapus kategori "${deleteDialog.category?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        isLoading={deleteDialog.isDeleting}
        variant="danger"
      />
    </div>
  );
}
