import { parseDateOnly } from "@/lib/dates";

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Matches Decimal(15, 2): up to 13 integer digits and 2 fraction digits
const AMOUNT_REGEX = /^\d{1,13}(\.\d{1,2})?$/;

// Prisma cuid() ids (and similar url-safe ids); rejects anything unexpected early
const ID_REGEX = /^[A-Za-z0-9_-]{1,64}$/;

export function isValidId(id: unknown): id is string {
  return typeof id === "string" && ID_REGEX.test(id);
}

/**
 * Normalise an amount to an exact decimal string ("50000", "12.5") without
 * going through floating-point arithmetic. Returns null if invalid.
 */
export function normalizeAmount(value: unknown): string | null {
  let raw: string;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    raw = String(value);
  } else if (typeof value === "string") {
    raw = value.trim();
  } else {
    return null;
  }
  if (!AMOUNT_REGEX.test(raw)) return null;
  return raw;
}

export function validateRegisterInput(data: {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const name = data.name?.trim() || "";
  const email = data.email?.trim() || "";
  const password = data.password || "";
  const confirmPassword = data.confirmPassword || "";

  if (!name) {
    errors.name = "Nama lengkap wajib diisi";
  } else if (name.length < 2) {
    errors.name = "Nama minimal 2 karakter";
  }

  if (!email) {
    errors.email = "Email wajib diisi";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Format email tidak valid";
  }

  if (!password) {
    errors.password = "Password wajib diisi";
  } else if (password.length < 6) {
    errors.password = "Password minimal terdiri dari 6 karakter";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Konfirmasi password wajib diisi";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Konfirmasi password tidak cocok dengan password";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateLoginInput(data: {
  email?: string;
  password?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const email = data.email?.trim() || "";
  const password = data.password || "";

  if (!email) {
    errors.email = "Email wajib diisi";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Format email tidak valid";
  }

  if (!password) {
    errors.password = "Password wajib diisi";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateTransactionInput(data: {
  type?: string;
  title?: string;
  amount?: number | string;
  categoryId?: string;
  date?: string | Date;
  description?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Type validation
  if (!data.type || (data.type !== "INCOME" && data.type !== "EXPENSE")) {
    errors.type = "Tipe transaksi harus INCOME atau EXPENSE";
  }

  // Title validation
  const title = typeof data.title === "string" ? data.title.trim() : "";
  if (!title) {
    errors.title = "Nama transaksi wajib diisi";
  } else if (title.length < 2) {
    errors.title = "Nama transaksi minimal 2 karakter";
  } else if (title.length > 100) {
    errors.title = "Nama transaksi maksimal 100 karakter";
  }

  // Amount validation (strictly positive, non-zero, max 2 decimals)
  if (data.amount === undefined || data.amount === null || data.amount === "") {
    errors.amount = "Nominal transaksi wajib diisi";
  } else if (typeof data.amount === "number" && data.amount <= 0) {
    errors.amount = "Nominal harus lebih besar dari 0";
  } else if (typeof data.amount === "string" && data.amount.trim().startsWith("-")) {
    errors.amount = "Nominal harus lebih besar dari 0";
  } else {
    const normalized = normalizeAmount(data.amount);
    if (normalized === null) {
      errors.amount = "Nominal harus berupa angka valid (maksimal 2 angka desimal)";
    } else if (!/[1-9]/.test(normalized)) {
      errors.amount = "Nominal harus lebih besar dari 0";
    }
  }

  // Category validation
  const categoryId = typeof data.categoryId === "string" ? data.categoryId.trim() : "";
  if (!categoryId) {
    errors.categoryId = "Kategori transaksi wajib dipilih";
  } else if (!isValidId(categoryId)) {
    errors.categoryId = "Kategori tidak valid";
  }

  // Date validation (calendar day, see lib/dates.ts)
  if (!data.date) {
    errors.date = "Tanggal transaksi wajib diisi";
  } else if (!parseDateOnly(data.date)) {
    errors.date = "Format tanggal tidak valid";
  }

  // Description validation (optional, but check type and length)
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== "string") {
      errors.description = "Deskripsi tidak valid";
    } else if (data.description.length > 500) {
      errors.description = "Deskripsi maksimal 500 karakter";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateCategoryInput(data: {
  name?: string;
  type?: string;
  color?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) {
    errors.name = "Nama kategori wajib diisi";
  } else if (name.length < 2) {
    errors.name = "Nama kategori minimal 2 karakter";
  } else if (name.length > 50) {
    errors.name = "Nama kategori maksimal 50 karakter";
  }

  if (!data.type || (data.type !== "INCOME" && data.type !== "EXPENSE")) {
    errors.type = "Tipe kategori harus INCOME atau EXPENSE";
  }

  if (data.color && typeof data.color === "string") {
    const trimmedColor = data.color.trim();
    if (trimmedColor && !/^#([0-9a-fA-F]{3}){1,2}$/.test(trimmedColor)) {
      errors.color = "Format kode warna hex tidak valid (contoh: #10b981)";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
