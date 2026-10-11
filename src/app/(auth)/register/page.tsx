"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Nama lengkap wajib diisi";
    if (!email.trim()) errors.email = "Email wajib diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Format email tidak valid";

    if (!password) errors.password = "Password wajib diisi";
    else if (password.length < 8) errors.password = "Password minimal 8 karakter";

    if (!confirmPassword) errors.confirmPassword = "Konfirmasi password wajib diisi";
    else if (password !== confirmPassword) errors.confirmPassword = "Konfirmasi password tidak cocok";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.errors) {
          setFieldErrors(data.errors);
        }
        setErrorMessage(data.message || "Pendaftaran gagal. Silakan periksa kembali data Anda.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage(data.message || "Akun berhasil dibuat! Mengalihkan ke dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 700);
    } catch {
      setErrorMessage("Terjadi gangguan koneksi ke server. Silakan coba kembali.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 group transition-transform hover:scale-105"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
              <Wallet className="h-6 w-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
              Expense<span className="text-emerald-600">Tracker</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl pt-2">
            Buat Akun Baru
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Daftar sekarang untuk memulai pencatatan keuangan pribadi Anda
          </p>
        </div>

        {/* Register Card */}
        <Card className="shadow-lg border-slate-200/80 dark:border-slate-800">
          <CardContent className="p-6 sm:p-8">
            {errorMessage && (
              <Alert
                variant="error"
                className="mb-5"
                onClose={() => setErrorMessage(null)}
              >
                {errorMessage}
              </Alert>
            )}

            {successMessage && (
              <Alert variant="success" className="mb-5">
                {successMessage}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nama Lengkap"
                type="text"
                placeholder="cth: John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={fieldErrors.name}
                leftIcon={<User className="w-4 h-4" />}
                autoComplete="name"
                required
              />

              <Input
                label="Email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={fieldErrors.email}
                leftIcon={<Mail className="w-4 h-4" />}
                autoComplete="email"
                required
              />

              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={fieldErrors.password}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                    aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                autoComplete="new-password"
                required
              />

              <Input
                label="Konfirmasi Password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Ketik ulang password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={fieldErrors.confirmPassword}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                    aria-label={showConfirmPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                autoComplete="new-password"
                required
              />

              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Password dienkripsi secara aman dengan algoritma Bcrypt (10 salt rounds).</span>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-3"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Daftar Akun Baru
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Login link */}
        <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Sudah memiliki akun?{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Masuk sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
