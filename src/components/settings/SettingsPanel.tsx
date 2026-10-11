"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, Trash2, UserRound } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SafeUser } from "@/types";

type Feedback = { type: "success" | "error"; message: string } | null;

interface ApiResult {
  ok: boolean;
  message: string;
  errors: Record<string, string>;
}

async function sendJson(method: string, url: string, body?: unknown): Promise<ApiResult> {
  try {
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return {
      ok: res.ok && json.success === true,
      message: json.message || (res.ok ? "Berhasil." : "Terjadi kesalahan. Silakan coba lagi."),
      errors: json.errors || {},
    };
  } catch {
    return { ok: false, message: "Tidak dapat terhubung ke server. Periksa koneksi Anda.", errors: {} };
  }
}

function SectionIcon({ children, tone = "emerald" }: { children: React.ReactNode; tone?: "emerald" | "rose" }) {
  const toneClass =
    tone === "rose"
      ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
      : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400";
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>{children}</div>
  );
}

function ProfileSection({ user }: { user: SafeUser }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setErrors({});
    if (name.trim().length < 2) {
      setErrors({ name: "Nama minimal 2 karakter" });
      return;
    }
    setSaving(true);
    const result = await sendJson("PUT", "/api/account", { name });
    setSaving(false);
    setErrors(result.errors);
    setFeedback({ type: result.ok ? "success" : "error", message: result.message });
    if (result.ok) router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <SectionIcon>
            <UserRound className="h-5 w-5" />
          </SectionIcon>
          <div>
            <CardTitle>Profil</CardTitle>
            <CardDescription>Nama yang ditampilkan di aplikasi.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        {feedback && (
          <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
            {feedback.message}
          </Alert>
        )}
        <Input
          label="Nama lengkap"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          maxLength={100}
          autoComplete="name"
          required
        />
        <Input
          label="Email"
          value={user.email}
          disabled
          readOnly
          helperText="Email dipakai untuk login dan tidak dapat diubah."
        />
        <div className="flex justify-end">
          <Button type="submit" isLoading={saving} disabled={name.trim() === user.name}>
            Simpan Profil
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordSection() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const clientErrors: Record<string, string> = {};
    if (!form.currentPassword) clientErrors.currentPassword = "Password saat ini wajib diisi";
    if (form.newPassword.length < 8) clientErrors.newPassword = "Password minimal 8 karakter";
    if (form.newPassword !== form.confirmPassword) clientErrors.confirmPassword = "Konfirmasi password tidak cocok";
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSaving(true);
    const result = await sendJson("PUT", "/api/account/password", form);
    setSaving(false);
    setErrors(result.errors);
    setFeedback({ type: result.ok ? "success" : "error", message: result.message });
    if (result.ok) setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <SectionIcon>
            <KeyRound className="h-5 w-5" />
          </SectionIcon>
          <div>
            <CardTitle>Ganti Password</CardTitle>
            <CardDescription>Setelah diganti, sesi di perangkat lain otomatis berakhir.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        {feedback && (
          <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
            {feedback.message}
          </Alert>
        )}
        <Input
          type="password"
          label="Password saat ini"
          value={form.currentPassword}
          onChange={update("currentPassword")}
          error={errors.currentPassword}
          autoComplete="current-password"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="password"
            label="Password baru"
            value={form.newPassword}
            onChange={update("newPassword")}
            error={errors.newPassword}
            placeholder="Minimal 8 karakter"
            autoComplete="new-password"
            required
          />
          <Input
            type="password"
            label="Konfirmasi password baru"
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
            error={errors.confirmPassword}
            autoComplete="new-password"
            required
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" isLoading={saving}>
            Ganti Password
          </Button>
        </div>
      </form>
    </Card>
  );
}

function SessionsSection() {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    const result = await sendJson("DELETE", "/api/account/sessions");
    if (result.ok) {
      router.push("/login");
      router.refresh();
      return;
    }
    setLoading(false);
    setConfirmOpen(false);
    setError(result.message);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <SectionIcon>
            <LogOut className="h-5 w-5" />
          </SectionIcon>
          <div>
            <CardTitle>Sesi Login</CardTitle>
            <CardDescription>
              Akhiri semua sesi, misalnya jika Anda lupa logout di perangkat lain.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <div className="space-y-4 p-6">
        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Anda juga akan keluar dari perangkat ini dan perlu login kembali.
          </p>
          <Button variant="outline" onClick={() => setConfirmOpen(true)} className="shrink-0">
            Logout dari Semua Perangkat
          </Button>
        </div>
      </div>
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        isLoading={loading}
        variant="warning"
        title="Logout dari semua perangkat?"
        message="Semua sesi aktif, termasuk sesi ini, akan diakhiri."
        confirmLabel="Ya, Logout Semua"
      />
    </Card>
  );
}

function DeleteAccountSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (loading) return;
    setOpen(false);
    setPassword("");
    setError(null);
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Masukkan password untuk konfirmasi");
      return;
    }
    setLoading(true);
    const result = await sendJson("DELETE", "/api/account", { password });
    if (result.ok) {
      router.push("/");
      router.refresh();
      return;
    }
    setLoading(false);
    setError(result.errors.password || result.message);
  };

  return (
    <Card className="border-rose-200 dark:border-rose-900/60">
      <CardHeader>
        <div className="flex items-center gap-3">
          <SectionIcon tone="rose">
            <Trash2 className="h-5 w-5" />
          </SectionIcon>
          <div>
            <CardTitle>Hapus Akun</CardTitle>
            <CardDescription>
              Menghapus akun beserta seluruh transaksi, kategori, dan anggaran secara permanen.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Tindakan ini tidak dapat dibatalkan. Ekspor data Anda ke CSV terlebih dahulu jika masih diperlukan.
        </p>
        <Button variant="danger" onClick={() => setOpen(true)} className="shrink-0">
          Hapus Akun
        </Button>
      </div>
      <Modal
        isOpen={open}
        onClose={close}
        title="Hapus akun secara permanen?"
        description="Semua data Anda akan dihapus dan tidak dapat dipulihkan."
        maxWidth="sm"
      >
        <form onSubmit={handleDelete} className="space-y-4" noValidate>
          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error ?? undefined}
            autoComplete="current-password"
            required
          />
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={close} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" variant="danger" size="sm" isLoading={loading}>
              Hapus Akun Saya
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

export function SettingsPanel({ user }: { user: SafeUser }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ProfileSection user={user} />
      <PasswordSection />
      <SessionsSection />
      <DeleteAccountSection />
    </div>
  );
}
