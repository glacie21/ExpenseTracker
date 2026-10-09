"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { Category, Transaction, TransactionType } from "@/types";
import { Plus, Download, RefreshCw } from "lucide-react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"ALL" | TransactionType>("ALL");
  const [categoryId, setCategoryId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    transaction: Transaction | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    transaction: null,
    isDeleting: false,
  });

  // Load categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.success && json.data?.categories) {
        setCategories(json.data.categories);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }, []);

  // Load transactions
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (type !== "ALL") params.set("type", type);
      if (categoryId) params.set("categoryId", categoryId);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("sort", sort);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        setTransactions(json.data.transactions);
        setPagination(json.data.pagination);
      } else {
        setFeedback({
          type: "error",
          message: json.message || "Gagal memuat transaksi.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Terjadi kesalahan jaringan saat mengambil data transaksi.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [search, type, categoryId, startDate, endDate, sort, page, limit]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleResetFilters = () => {
    setSearch("");
    setType("ALL");
    setCategoryId("");
    setStartDate("");
    setEndDate("");
    setSort("newest");
    setPage(1);
  };

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const handleDeletePrompt = (tx: Transaction) => {
    setDeleteConfirm({
      isOpen: true,
      transaction: tx,
      isDeleting: false,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.transaction) return;

    setDeleteConfirm((prev) => ({ ...prev, isDeleting: true }));
    try {
      const res = await fetch(`/api/transactions/${deleteConfirm.transaction.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setFeedback({
          type: "success",
          message: `Transaksi "${deleteConfirm.transaction.title}" berhasil dihapus.`,
        });
        setDeleteConfirm({ isOpen: false, transaction: null, isDeleting: false });
        fetchTransactions();
      } else {
        setFeedback({
          type: "error",
          message: json.message || "Gagal menghapus transaksi.",
        });
        setDeleteConfirm((prev) => ({ ...prev, isDeleting: false }));
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Terjadi gangguan jaringan saat menghapus transaksi.",
      });
      setDeleteConfirm((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Daftar Transaksi
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola seluruh riwayat pemasukan dan pengeluaran finansial Anda secara terperinci.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTransactions()}
            leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />}
            title="Muat ulang data"
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleOpenAddModal}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <Alert
          variant={feedback.type}
          onClose={() => setFeedback(null)}
          title={feedback.type === "success" ? "Berhasil" : "Perhatian"}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <TransactionFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        type={type}
        onTypeChange={(val) => {
          setType(val);
          setPage(1);
        }}
        categoryId={categoryId}
        onCategoryChange={(val) => {
          setCategoryId(val);
          setPage(1);
        }}
        startDate={startDate}
        onStartDateChange={(val) => {
          setStartDate(val);
          setPage(1);
        }}
        endDate={endDate}
        onEndDateChange={(val) => {
          setEndDate(val);
          setPage(1);
        }}
        sort={sort}
        onSortChange={(val) => {
          setSort(val);
          setPage(1);
        }}
        categories={categories}
        onReset={handleResetFilters}
      />

      {/* Transaction Table */}
      <TransactionTable
        transactions={transactions}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDeletePrompt}
        pagination={pagination}
        onPageChange={(newPage) => setPage(newPage)}
        onAddNew={handleOpenAddModal}
      />

      {/* Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSuccess={() => {
          setFeedback({
            type: "success",
            message: editingTransaction
              ? "Transaksi berhasil diperbarui."
              : "Transaksi baru berhasil ditambahkan.",
          });
          fetchTransactions();
        }}
        initialData={editingTransaction}
        categories={categories}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() =>
          setDeleteConfirm({ isOpen: false, transaction: null, isDeleting: false })
        }
        onConfirm={handleConfirmDelete}
        title="Hapus Transaksi?"
        message={`Apakah Anda yakin ingin menghapus transaksi "${deleteConfirm.transaction?.title}"? Tindakan ini akan memperbarui saldo Anda dan tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        isLoading={deleteConfirm.isDeleting}
        variant="danger"
      />
    </div>
  );
}
