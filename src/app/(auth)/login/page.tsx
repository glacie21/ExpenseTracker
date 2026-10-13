"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { AuthFrame } from "@/components/layout/AuthFrame";
import { RevealButton } from "@/components/ui/RevealButton";
import { safeRedirectPath } from "@/lib/jwt";

const LINK_STYLE = "text-ink underline decoration-rule underline-offset-4 hover:decoration-ink";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = safeRedirectPath(searchParams.get("redirect"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleFillDemo = () => {
    setEmail("demo@example.com");
    setPassword("Password123!");
    setFieldErrors({});
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    // Client-side quick validation
    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = "Email wajib diisi";
    if (!password) errors.password = "Password wajib diisi";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.errors) {
          setFieldErrors(data.errors);
        }
        setErrorMessage(data.message || "Gagal masuk. Periksa email dan password Anda.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Berhasil masuk. Membuka dashboard…");
      setTimeout(() => {
        router.push(redirectPath);
        router.refresh();
      }, 700);
    } catch {
      setErrorMessage("Terjadi gangguan koneksi ke server. Silakan coba kembali.");
      setIsLoading(false);
    }
  };

  return (
    <>
      {errorMessage && (
        <Alert variant="error" className="mb-6" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" className="mb-6">
          {successMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          autoComplete="email"
          required
        />

        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          rightIcon={<RevealButton shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
          autoComplete="current-password"
          required
        />

        <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-ink-2">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 accent-ink"
          />
          Ingat saya selama 30 hari
        </label>

        <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
          Masuk
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-3">
        Sekadar mencoba?{" "}
        <button type="button" onClick={handleFillDemo} className={LINK_STYLE}>
          Isi dengan akun demo
        </button>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthFrame
      title="Masuk"
      subtitle="Lanjutkan pencatatan keuangan Anda."
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/register" className={LINK_STYLE}>
            Daftar
          </Link>
        </>
      }
    >
      {/* Suspense boundary for useSearchParams */}
      <Suspense fallback={<p className="text-sm text-ink-3">Memuat formulir…</p>}>
        <LoginForm />
      </Suspense>
    </AuthFrame>
  );
}
