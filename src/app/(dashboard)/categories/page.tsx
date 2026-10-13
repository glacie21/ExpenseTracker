"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CategoryModal } from "@/components/categories/CategoryModal";
import { Category, TransactionType } from "@/types";
import { Plus } from "lucide-react";
import { RowActions } from "@/components/ui/RowActions";
import { EmptyBlock, ErrorState } from "@/components/ui/States";
import { tabClass } from "@/components/ui/fieldStyles";

const TYPE_HEADING: Record<TransactionType, string> = {
  INCOME: "Pemasukan",
  EXPENSE: "Pengeluaran",
};

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | TransactionType>("ALL");
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<{
    token: number;
    categories: Category[];
    error: string | null;
  } | null>(null);
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

  // isLoading diturunkan dari token sehingga respons lama diabaikan
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/categories", { signal: controller.signal })
      .then(async (res) => ({ res, json: await res.json() }))
      .then(({ res, json }) => {
        if (res.ok && json.success && json.data?.categories) {
          setResult({ token: reloadToken, categories: json.data.categories, error: null });
        } else {
          setResult({
            token: reloadToken,
            categories: [],
            error: json.message || "Gagal memuat kategori.",
          });
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setResult({
          token: reloadToken,
          categories: [],
          error: "Terjadi gangguan jaringan saat memuat daftar kategori.",
        });
      });
    return () => controller.abort();
  }, [reloadToken]);

  const isLoading = result?.token !== reloadToken;
  const categories = result?.categories ?? [];
  const loadError = result?.error ?? null;
  const fetchCategories = () => setReloadToken((t) => t + 1);

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
        message: `"${category.name}" masih dipakai ${txCount} transaksi. Pindahkan transaksi itu ke kategori lain dulu, baru kategori ini bisa dihapus.`,
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

  const tabs: { value: "ALL" | TransactionType; label: string; count: number }[] = [
    { value: "ALL", label: "Semua", count: categories.length },
    { value: "INCOME", label: "Pemasukan", count: incomeCategories.length },
    { value: "EXPENSE", label: "Pengeluaran", count: expenseCategories.length },
  ];
  const groups = (["INCOME", "EXPENSE"] as const)
    .filter((t) => activeTab === "ALL" || activeTab === t)
    .map((t) => ({ type: t, items: filteredCategories.filter((c) => c.type === t) }));

  const renderRow = (cat: Category) => {
    const txCount = cat._count?.transactions || 0;
    return (
      <li key={cat.id} className="flex items-center gap-3 border-b border-rule-soft py-3 pr-4 pl-5 last:border-0 sm:pl-6">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: cat.color || "var(--ink-3)" }}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-ink">{cat.name}</span>
        {txCount > 0 ? (
          <Link
            href={`/transactions?type=${cat.type}&categoryId=${cat.id}`}
            className="shrink-0 text-xs text-ink-3 underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink"
          >
            <span className="num text-sm">{txCount}</span> transaksi
          </Link>
        ) : (
          <span className="shrink-0 text-xs text-ink-3">belum dipakai</span>
        )}
        <RowActions label={cat.name} onEdit={() => handleEdit(cat)} onDelete={() => handleDeletePrompt(cat)} />
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-rule sm:flex-row sm:items-end sm:justify-between">
        <div className="-mb-px flex gap-5" role="group" aria-label="Tipe kategori">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={activeTab === tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={tabClass(activeTab === tab.value)}
            >
              {tab.label} <span className="num text-ink-3">{isLoading ? "" : tab.count}</span>
            </button>
          ))}
        </div>
        <div className="pb-3">
          <Button
            variant="primary"
            onClick={() => handleOpenAddModal(activeTab === "INCOME" ? "INCOME" : "EXPENSE")}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Tambah kategori
          </Button>
        </div>
      </div>

      {feedback && (
        <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {loadError && !isLoading ? (
        <ErrorState title="Kategori gagal dimuat" message={loadError} onRetry={fetchCategories} />
      ) : isLoading ? (
        <div className="h-64 animate-pulse rounded-sm border border-rule bg-surface" aria-busy="true" />
      ) : filteredCategories.length === 0 ? (
        <EmptyBlock
          title="Belum ada kategori"
          action={
            <Button onClick={() => handleOpenAddModal(activeTab === "INCOME" ? "INCOME" : "EXPENSE")}>
              Tambah kategori
            </Button>
          }
        >
          Kategori mengelompokkan transaksi, dan menjadi dasar anggaran bulanan.
        </EmptyBlock>
      ) : (
        <div className={`grid grid-cols-1 gap-6 ${groups.length > 1 ? "lg:grid-cols-2" : ""}`}>
          {groups.map((group) => (
            <section
              key={group.type}
              aria-labelledby={`cat-${group.type}`}
              className="self-start rounded-sm border border-rule bg-surface"
            >
              <div className="flex items-baseline justify-between gap-4 border-b border-rule px-5 py-4 sm:px-6">
                <h2 id={`cat-${group.type}`} className="font-serif text-lg font-medium text-ink">
                  {TYPE_HEADING[group.type]}
                </h2>
                <span className="text-xs text-ink-3">
                  <span className="num text-sm">{group.items.length}</span> kategori
                </span>
              </div>
              {group.items.length === 0 ? (
                <p className="px-5 py-6 text-sm text-ink-3 sm:px-6">Belum ada kategori.</p>
              ) : (
                <ul className="text-sm">{group.items.map(renderRow)}</ul>
              )}
            </section>
          ))}
        </div>
      )}

      <p className="text-xs text-ink-3">
        Kategori yang masih dipakai transaksi atau anggaran tidak bisa dihapus, supaya tidak ada catatan
        yang kehilangan kategorinya.
      </p>

      {/* Category Modal (Add / Edit); key me-reset isi form setiap dibuka */}
      {isModalOpen && (
        <CategoryModal
          key={editingCategory?.id ?? `new-${defaultModalType}`}
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
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({ isOpen: false, category: null, isDeleting: false })
        }
        onConfirm={handleConfirmDelete}
        title="Hapus kategori?"
        message={`Kategori "${deleteDialog.category?.name}" akan dihapus. Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Hapus"
        isLoading={deleteDialog.isDeleting}
        variant="danger"
      />
    </div>
  );
}
