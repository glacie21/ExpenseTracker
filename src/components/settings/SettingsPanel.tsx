"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
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

/** One settings topic: heading and explanation on the left, the form on the right. */
function Section({
  title,
  description,
  danger = false,
  children,
}: {
  title: string;
  description: React.ReactNode;
  danger?: boolean;
  children: React.ReactNode;
}) {
  const headingId = React.useId();
  return (
    <section
      aria-labelledby={headingId}
      className="grid gap-4 border-b border-rule py-8 first:pt-0 last:border-0 md:grid-cols-3 md:gap-8"
    >
      <div>
        <h2 id={headingId} className={`font-display text-lg font-semibold ${danger ? "text-neg" : "text-ink"}`}>
          {title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-3">{description}</p>
      </div>
      <div className="md:col-span-2">{children}</div>
    </section>
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
    <Section title="Profil" description="Nama yang tampil di aplikasi.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
            Simpan
          </Button>
        </div>
      </form>
    </Section>
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
    <Section title="Password" description="Setelah diganti, sesi di perangkat lain otomatis berakhir. Sesi ini tetap berjalan.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
            Ganti password
          </Button>
        </div>
      </form>
    </Section>
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
    <Section
      title="Sesi login"
      description="Berguna jika Anda lupa keluar di perangkat lain, atau curiga akun dipakai orang lain."
    >
      <div className="space-y-4">
        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-2">
            Anda juga akan keluar dari perangkat ini dan perlu login kembali.
          </p>
          <Button variant="outline" onClick={() => setConfirmOpen(true)} className="shrink-0">
            Keluar dari semua perangkat
          </Button>
        </div>
      </div>
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        isLoading={loading}
        variant="warning"
        title="Keluar dari semua perangkat?"
        message="Semua sesi aktif, termasuk sesi ini, akan diakhiri. Anda perlu login lagi."
        confirmLabel="Keluar dari semua"
      />
    </Section>
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
    <Section
      title="Hapus akun"
      danger
      description="Akun beserta semua transaksi, kategori, dan anggaran dihapus permanen."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-2">
          Tidak bisa dibatalkan. Unduh CSV di halaman Transaksi lebih dulu jika datanya masih Anda perlukan.
        </p>
        <Button variant="danger" onClick={() => setOpen(true)} className="shrink-0">
          Hapus akun
        </Button>
      </div>
      <Modal
        isOpen={open}
        onClose={close}
        title="Hapus akun secara permanen?"
        description="Masukkan password untuk konfirmasi. Data yang dihapus tidak bisa dipulihkan."
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
          <div className="flex items-center justify-end gap-2 border-t border-rule-soft pt-4">
            <Button type="button" variant="outline" size="sm" onClick={close} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" variant="danger" size="sm" isLoading={loading}>
              Hapus akun saya
            </Button>
          </div>
        </form>
      </Modal>
    </Section>
  );
}

export function SettingsPanel({ user }: { user: SafeUser }) {
  return (
    <div className="max-w-4xl">
      <ProfileSection user={user} />
      <PasswordSection />
      <SessionsSection />
      <DeleteAccountSection />
    </div>
  );
}
