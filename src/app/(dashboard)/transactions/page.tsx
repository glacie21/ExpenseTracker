"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { Category, PaginatedTransactions, Transaction, TransactionType } from "@/types";
import { Download, Plus, RefreshCw } from "lucide-react";
import { downloadFile } from "@/lib/download";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_PAGINATION: PaginatedTransactions["pagination"] = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

function parseType(value: string | null): "ALL" | TransactionType | null {
  return value === "INCOME" || value === "EXPENSE" ? value : null;
}

interface LoadResult {
  key: string;
  transactions: Transaction[];
  pagination: PaginatedTransactions["pagination"];
  error: string | null;
}

function TransactionsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Filter & Search states (diinisialisasi dari URL agar bertahan saat reload)
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [type, setType] = useState<"ALL" | TransactionType>(
    parseType(searchParams.get("type")) ?? "ALL"
  );
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
  const [month, setMonth] = useState(searchParams.get("month") || "");
  const [year, setYear] = useState(searchParams.get("year") || "");
  const [sort, setSort] = useState<"newest" | "oldest">(
    searchParams.get("sort") === "oldest" ? "oldest" : "newest"
  );
  const [page, setPage] = useState(Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1));
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);

  // Quick action dari dashboard: /transactions?add=INCOME|EXPENSE langsung membuka form
  const addType = parseType(searchParams.get("add"));
  const [isModalOpen, setIsModalOpen] = useState(addType === "INCOME" || addType === "EXPENSE");
  const [modalDefaultType, setModalDefaultType] = useState<TransactionType>(
    addType === "INCOME" ? "INCOME" : "EXPENSE"
  );
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

  // Debounce search agar tidak memanggil API di setiap ketikan
  useEffect(() => {
    if (searchInput === search) return;
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  // Parameter filter yang dikirim ke API dan disimpan di URL
  const filterQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (type !== "ALL") params.set("type", type);
    if (categoryId) params.set("categoryId", categoryId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (year) params.set("year", year);
    if (year && month) params.set("month", month);
    if (sort !== "newest") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    return params.toString();
  }, [search, type, categoryId, startDate, endDate, month, year, sort, page]);

  // Simpan filter di URL (tanpa menambah history atau request server) agar bertahan saat reload
  useEffect(() => {
    window.history.replaceState(null, "", filterQuery ? `${pathname}?${filterQuery}` : pathname);
  }, [filterQuery, pathname]);

  // Load categories
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/categories", { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.categories) {
          setCategories(json.data.categories);
        }
      })
      .catch((err) => {
        if (err?.name !== "AbortError") console.error("Failed to load categories:", err);
      });
    return () => controller.abort();
  }, []);

  // Load transactions; isLoading diturunkan dari key sehingga respons lama diabaikan
  const requestKey = `${filterQuery}#${reloadToken}`;
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(filterQuery);
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));

    fetch(`/api/transactions?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => ({ res, json: await res.json() }))
      .then(({ res, json }) => {
        if (res.ok && json.success && json.data) {
          // Jika halaman saat ini sudah kosong (misal setelah hapus), mundur ke halaman terakhir
          if (json.data.transactions.length === 0 && page > json.data.pagination.totalPages) {
            setPage(json.data.pagination.totalPages);
            return;
          }
          setResult({
            key: requestKey,
            transactions: json.data.transactions,
            pagination: json.data.pagination,
            error: null,
          });
        } else {
          setResult({
            key: requestKey,
            transactions: [],
            pagination: EMPTY_PAGINATION,
            error: json.message || "Gagal memuat transaksi.",
          });
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setResult({
          key: requestKey,
          transactions: [],
          pagination: EMPTY_PAGINATION,
          error: "Terjadi kesalahan jaringan saat mengambil data transaksi.",
        });
      });

    return () => controller.abort();
  }, [filterQuery, page, requestKey]);

  const isLoading = result?.key !== requestKey;
  const transactions = result?.transactions ?? [];
  const pagination = result?.pagination ?? EMPTY_PAGINATION;
  const reload = () => setReloadToken((t) => t + 1);

  const [isExporting, setIsExporting] = useState(false);
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      // Filter aktif tanpa nomor halaman: ekspor mencakup semua hasil filter
      const params = new URLSearchParams(filterQuery);
      params.delete("page");
      const filename = await downloadFile(
        `/api/transactions/export?${params.toString()}`,
        "transaksi.csv"
      );
      setFeedback({ type: "success", message: `File ${filename} berhasil diunduh.` });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Gagal mengekspor transaksi.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearch("");
    setType("ALL");
    setCategoryId("");
    setStartDate("");
    setEndDate("");
    setMonth("");
    setYear("");
    setSort("newest");
    setPage(1);
  };

  // Setiap perubahan filter mengembalikan ke halaman 1
  const withPageReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setModalDefaultType(type === "INCOME" ? "INCOME" : "EXPENSE");
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
        reload();
        router.refresh();
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

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />}
            title="Muat ulang data"
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            isLoading={isExporting}
            leftIcon={<Download className="h-4 w-4" />}
            title="Unduh transaksi sesuai filter aktif sebagai CSV"
          >
            Export CSV
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
        search={searchInput}
        onSearchChange={setSearchInput}
        type={type}
        onTypeChange={withPageReset(setType)}
        categoryId={categoryId}
        onCategoryChange={withPageReset(setCategoryId)}
        startDate={startDate}
        onStartDateChange={withPageReset(setStartDate)}
        endDate={endDate}
        onEndDateChange={withPageReset(setEndDate)}
        month={month}
        onMonthChange={withPageReset(setMonth)}
        year={year}
        onYearChange={withPageReset(setYear)}
        sort={sort}
        onSortChange={withPageReset(setSort)}
        categories={categories}
        onReset={handleResetFilters}
      />

      {/* Transaction Table */}
      <TransactionTable
        transactions={transactions}
        isLoading={isLoading}
        error={result?.error}
        onRetry={reload}
        onEdit={handleEdit}
        onDelete={handleDeletePrompt}
        pagination={pagination}
        onPageChange={(newPage) => setPage(newPage)}
        onAddNew={handleOpenAddModal}
      />

      {/* Add / Edit Transaction Modal (key me-reset isi form setiap dibuka) */}
      {isModalOpen && (
        <TransactionModal
          key={editingTransaction?.id ?? `new-${modalDefaultType}`}
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
            reload();
            router.refresh();
          }}
          initialData={editingTransaction}
          defaultType={modalDefaultType}
          categories={categories}
        />
      )}

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

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-64 rounded-2xl border border-slate-200/80 bg-white animate-pulse dark:border-slate-800 dark:bg-slate-900" />
      }
    >
      <TransactionsView />
    </Suspense>
  );
}
