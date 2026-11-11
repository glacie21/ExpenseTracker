"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { AuthFrame } from "@/components/layout/AuthFrame";
import { RevealButton } from "@/components/ui/RevealButton";
import { PASSWORD_MIN_LENGTH, validateRegisterInput } from "@/lib/validations";

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

    // Same rules as the API
    const { isValid, errors } = validateRegisterInput({ name, email, password, confirmPassword });
    if (!isValid) {
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

      setSuccessMessage(data.message || "Akun berhasil dibuat. Membuka dashboard…");
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
    <AuthFrame
      title="Buat akun"
      subtitle="Gratis. Hanya butuh nama, email, dan password."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Masuk
          </Link>
        </>
      }
    >
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
          label="Nama"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
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
          autoComplete="email"
          required
        />

        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          helperText={`Minimal ${PASSWORD_MIN_LENGTH} karakter.`}
          rightIcon={<RevealButton shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
          autoComplete="new-password"
          required
        />

        <Input
          label="Ulangi password"
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
          rightIcon={
            <RevealButton
              shown={showConfirmPassword}
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          }
          autoComplete="new-password"
          required
        />

        <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
          Buat akun
        </Button>
      </form>
    </AuthFrame>
  );
}
