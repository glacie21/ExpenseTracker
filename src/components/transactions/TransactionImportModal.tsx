"use client";

import React, { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, RefreshCw, Upload } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Amount } from "@/components/ui/Amount";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { downloadFile } from "@/lib/download";
import { MAX_IMPORT_ROWS, TRANSACTION_CSV_HEADERS, type ImportPreviewData } from "@/lib/transactionsImportUtils";

interface TransactionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** `createdCategories` lets the page skip reloading categories when none were added. */
  onSuccess: (message: string, createdCategories: number) => void;
}

interface ImportResponse {
  success: boolean;
  message?: string;
  data?: ImportPreviewData & { createdCategoriesCount?: number };
}

async function postImport(body: { csvContent: string; dryRun: boolean; skipErrors?: boolean }): Promise<ImportResponse> {
  const res = await fetch("/api/transactions/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json: ImportResponse = await res.json();
  return { ...json, success: res.ok && json.success };
}

export function TransactionImportModal({
  isOpen,
  onClose,
  onSuccess,
}: TransactionImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [skipErrors, setSkipErrors] = useState(true);

  const resetState = () => {
    setSelectedFile(null);
    setCsvContent("");
    setPreviewData(null);
    setGeneralError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (isImporting) return;
    resetState();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      await downloadFile("/api/transactions/import", "template-transaksi.csv");
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : "Gagal mengunduh template CSV.");
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setGeneralError("Harap pilih file dengan format CSV (.csv).");
      return;
    }

    setSelectedFile(file);
    setGeneralError(null);
    setPreviewData(null);
    setIsVerifying(true);

    try {
      const text = await file.text();
      setCsvContent(text);

      const json = await postImport({ csvContent: text, dryRun: true });
      if (json.success && json.data) {
        setPreviewData(json.data);
      } else {
        setGeneralError(json.message || "File CSV tidak valid.");
      }
    } catch {
      setGeneralError("Terjadi gangguan jaringan saat memverifikasi file CSV.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!csvContent || !previewData) return;

    setIsImporting(true);
    setGeneralError(null);

    try {
      const json = await postImport({ csvContent, dryRun: false, skipErrors });
      if (json.success) {
        onSuccess(json.message ?? "", json.data?.createdCategoriesCount ?? 0);
        resetState();
        onClose();
      } else {
        setGeneralError(json.message || "Gagal mengimpor transaksi.");
      }
    } catch {
      setGeneralError("Terjadi gangguan saat menyimpan data impor ke server.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Impor Transaksi CSV"
      description="Unggah file CSV untuk menambahkan transaksi secara massal."
      maxWidth="xl"
    >
      <div className="space-y-5">
        {generalError && (
          <Alert variant="error" onClose={() => setGeneralError(null)}>
            {generalError}
          </Alert>
        )}

        {/* STEP 1: Belum ada file atau hasil verifikasi */}
        {!previewData && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 rounded-xl border border-rule-soft bg-sunken/40 p-4 text-xs text-ink-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-ink">Format kolom yang didukung:</p>
                <p className="mt-0.5 text-ink-3">
                  <span className="font-mono text-accent">{Object.values(TRANSACTION_CSV_HEADERS).join(", ")}</span>
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                isLoading={isDownloadingTemplate}
                leftIcon={<Download className="h-3.5 w-3.5" />}
                className="shrink-0"
              >
                Unduh Template CSV
              </Button>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rule py-12 px-6 text-center transition-colors hover:border-accent hover:bg-accent-soft/20"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                {isVerifying ? (
                  <RefreshCw className="h-6 w-6 animate-spin" />
                ) : (
                  <Upload className="h-6 w-6" />
                )}
              </div>
              <p className="mt-4 font-display font-medium text-ink">
                {isVerifying ? "Memverifikasi isi file CSV..." : "Pilih file CSV atau tarik ke sini"}
              </p>
              <p className="mt-1 text-xs text-ink-3">File CSV dengan encoding UTF-8 (maks. {MAX_IMPORT_ROWS.toLocaleString("id-ID")} baris)</p>
            </div>
          </div>
        )}

        {/* STEP 2: Preview data yang siap diimpor */}
        {previewData && (
          <div className="space-y-5">
            {/* Rangkuman */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rule-soft bg-sunken/50 p-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileSpreadsheet className="h-5 w-5 text-accent shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{selectedFile?.name}</p>
                  <p className="text-xs text-ink-3">
                    {previewData.totalRows} baris terdeteksi • {((selectedFile?.size ?? 0) / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetState}
                disabled={isImporting}
              >
                Ganti file
              </Button>
            </div>

            {/* Statistik Ringkas */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-rule-soft bg-surface p-3">
                <p className="text-xs text-ink-3">Siap Diimpor</p>
                <p className="mt-1 flex items-center gap-1.5 font-display text-xl font-semibold text-pos">
                  <CheckCircle2 className="h-4 w-4" />
                  {previewData.validCount}
                </p>
              </div>

              <div className="rounded-xl border border-rule-soft bg-surface p-3">
                <p className="text-xs text-ink-3">Baris Bermasalah</p>
                <p className={`mt-1 flex items-center gap-1.5 font-display text-xl font-semibold ${previewData.errorCount > 0 ? "text-neg" : "text-ink-2"}`}>
                  <AlertCircle className="h-4 w-4" />
                  {previewData.errorCount}
                </p>
              </div>

              <div className="col-span-2 rounded-xl border border-rule-soft bg-surface p-3 sm:col-span-1">
                <p className="text-xs text-ink-3">Kategori Baru Otomatis</p>
                <p className="mt-1 font-display text-xl font-semibold text-accent">
                  {previewData.newCategories.length}
                </p>
              </div>
            </div>

            {/* Alert jika ada kategori baru yang dibuat */}
            {previewData.newCategories.length > 0 && (
              <div className="rounded-xl border border-accent/20 bg-accent-soft/30 p-3 text-xs text-ink">
                <span className="font-semibold text-accent">Kategori baru terdeteksi: </span>
                {previewData.newCategories.map((c, i) => (
                  <span key={i} className="inline-block mr-1.5">
                    <Badge variant={c.type === "INCOME" ? "success" : "neutral"}>
                      {c.name} ({c.type})
                    </Badge>
                  </span>
                ))}
              </div>
            )}

            {/* Preview Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-ink-3">
                <span>Pratinjau transaksi ({previewData.previewRows.length} baris pertama):</span>
                {previewData.totalRows > previewData.previewRows.length && (
                  <span>+ {previewData.totalRows - previewData.previewRows.length} baris lainnya</span>
                )}
              </div>

              <div className="max-h-56 overflow-auto rounded-xl border border-rule bg-surface">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 border-b border-rule bg-sunken/80 text-ink-2 backdrop-blur-sm">
                    <tr>
                      <th className="py-2 px-3 font-medium">Baris</th>
                      <th className="py-2 px-3 font-medium">Tanggal</th>
                      <th className="py-2 px-3 font-medium">Judul</th>
                      <th className="py-2 px-3 font-medium">Tipe</th>
                      <th className="py-2 px-3 font-medium">Kategori</th>
                      <th className="py-2 px-3 text-right font-medium">Nominal</th>
                      <th className="py-2 px-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule-soft">
                    {previewData.previewRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={row.errors.length === 0 ? "hover:bg-sunken/30" : "bg-neg-soft/30"}
                      >
                        <td className="py-2 px-3 font-mono text-ink-3">{row.rowNumber}</td>
                        <td className="py-2 px-3 whitespace-nowrap text-ink">{row.date}</td>
                        <td className="py-2 px-3 font-medium text-ink max-w-[140px] truncate" title={row.title}>
                          {row.title}
                        </td>
                        <td className="py-2 px-3">
                          <Badge variant={row.type === "INCOME" ? "success" : "danger"}>
                            {row.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-ink-2 truncate max-w-[120px]" title={row.categoryName}>
                          {row.categoryName}
                          {row.isNewCategory && <span className="ml-1 text-[10px] text-accent">(baru)</span>}
                        </td>
                        <td className="py-2 px-3 text-right font-medium">
                          <Amount value={Number(row.amount)} type={row.type} />
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {row.errors.length === 0 ? (
                            <span className="text-pos font-medium">OK</span>
                          ) : (
                            <span className="text-neg font-medium" title={row.errors.join("; ")}>
                              Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Error handling jika ada baris tidak valid */}
            {previewData.errorCount > 0 && (
              <div className="space-y-3 rounded-xl border border-neg/20 bg-neg-soft/40 p-3.5 text-xs">
                <div className="flex items-start gap-2 text-neg">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{previewData.errorCount} baris memiliki masalah format:</p>
                    <ul className="mt-1 list-disc list-inside space-y-0.5 text-ink-2 max-h-24 overflow-y-auto">
                      {previewData.errorSamples.map((err) => (
                        <li key={err.row}>
                          Baris {err.row}: {err.errors.join(", ")}
                        </li>
                      ))}
                      {previewData.errorCount > previewData.errorSamples.length && (
                        <li>...dan {previewData.errorCount - previewData.errorSamples.length} baris lainnya</li>
                      )}
                    </ul>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1 font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={skipErrors}
                    onChange={(e) => setSkipErrors(e.target.checked)}
                    className="rounded border-rule text-accent focus:ring-accent"
                  />
                  <span>Lewati {previewData.errorCount} baris bermasalah dan impor {previewData.validCount} transaksi valid</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-rule-soft pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isImporting}
          >
            Batal
          </Button>

          {previewData && (
            <Button
              type="button"
              variant="primary"
              onClick={handleExecuteImport}
              isLoading={isImporting}
              disabled={
                previewData.validCount === 0 ||
                (previewData.errorCount > 0 && !skipErrors)
              }
              leftIcon={<Upload className="h-4 w-4" />}
            >
              Impor {previewData.validCount} Transaksi
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

