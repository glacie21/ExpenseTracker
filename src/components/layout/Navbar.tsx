"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Wallet, Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white">
              Expense<span className="text-emerald-600">Tracker</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide">
              FINANCIAL COMPANION
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a
            href="#features"
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            Fitur Utama
          </a>
          <a
            href="#security"
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            Keamanan
          </a>
          <a
            href="#architecture"
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            Arsitektur
          </a>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Masuk
            </Button>
          </Link>
          <Link href="/register">
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Mulai Gratis
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col space-y-2 text-sm font-medium">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-slate-700 hover:text-emerald-600 dark:text-slate-300"
            >
              Fitur Utama
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-slate-700 hover:text-emerald-600 dark:text-slate-300"
            >
              Keamanan
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-slate-700 hover:text-emerald-600 dark:text-slate-300"
            >
              Arsitektur
            </a>
          </div>
          <div className="pt-2 flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full">
                Masuk ke Akun
              </Button>
            </Link>
            <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full">
                Daftar Sekarang
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
