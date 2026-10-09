import { TransactionType } from "@/types";

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  // Amount validation (strictly positive, non-zero)
  if (data.amount === undefined || data.amount === null || data.amount === "") {
    errors.amount = "Nominal transaksi wajib diisi";
  } else {
    const numericAmount = typeof data.amount === "string" ? parseFloat(data.amount) : data.amount;
    if (isNaN(numericAmount) || !isFinite(numericAmount)) {
      errors.amount = "Nominal harus berupa angka yang valid";
    } else if (numericAmount <= 0) {
      errors.amount = "Nominal harus lebih besar dari 0";
    }
  }

  // Category validation
  const categoryId = typeof data.categoryId === "string" ? data.categoryId.trim() : "";
  if (!categoryId) {
    errors.categoryId = "Kategori transaksi wajib dipilih";
  }

  // Date validation
  if (!data.date) {
    errors.date = "Tanggal transaksi wajib diisi";
  } else {
    const parsedDate = new Date(data.date);
    if (isNaN(parsedDate.getTime())) {
      errors.date = "Format tanggal tidak valid";
    }
  }

  // Description validation (optional, but check length)
  if (data.description && typeof data.description === "string" && data.description.length > 500) {
    errors.description = "Deskripsi maksimal 500 karakter";
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
