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

export const PASSWORD_MIN_LENGTH = 8;
// bcrypt ignores everything after 72 bytes, so longer passwords would give a false sense of security
const PASSWORD_MAX_BYTES = 72;

/** Error message for a new password, or null when it is acceptable. */
/** JSON bodies are untyped: anything that is not a string counts as empty. */
function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function passwordError(password: string): string | null {
  if (!password) return "Password wajib diisi";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password minimal terdiri dari ${PASSWORD_MIN_LENGTH} karakter`;
  }
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    return `Password maksimal ${PASSWORD_MAX_BYTES} karakter`;
  }
  return null;
}

/** Display name rule shared by registration and profile settings. */
export function nameError(name: string): string | null {
  if (!name) return "Nama lengkap wajib diisi";
  if (name.length < 2) return "Nama minimal 2 karakter";
  if (name.length > 100) return "Nama maksimal 100 karakter";
  return null;
}

export function validateRegisterInput(data: {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const name = asString(data.name).trim();
  const email = asString(data.email).trim();
  const password = asString(data.password);
  const confirmPassword = asString(data.confirmPassword);

  const nameProblem = nameError(name);
  if (nameProblem) errors.name = nameProblem;

  if (!email) {
    errors.email = "Email wajib diisi";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Format email tidak valid";
  }

  const passwordProblem = passwordError(password);
  if (passwordProblem) errors.password = passwordProblem;

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

export function validatePasswordChangeInput(data: {
  currentPassword?: unknown;
  newPassword?: unknown;
  confirmPassword?: unknown;
}): ValidationResult {
  const errors: Record<string, string> = {};
  const currentPassword = typeof data.currentPassword === "string" ? data.currentPassword : "";
  const newPassword = typeof data.newPassword === "string" ? data.newPassword : "";
  const confirmPassword = typeof data.confirmPassword === "string" ? data.confirmPassword : "";

  if (!currentPassword) errors.currentPassword = "Password saat ini wajib diisi";

  const newProblem = passwordError(newPassword);
  if (newProblem) {
    errors.newPassword = newProblem;
  } else if (newPassword === currentPassword) {
    errors.newPassword = "Password baru harus berbeda dari password saat ini";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Konfirmasi password wajib diisi";
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = "Konfirmasi password tidak cocok dengan password baru";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateLoginInput(data: {
  email?: unknown;
  password?: unknown;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const email = asString(data.email).trim();
  const password = asString(data.password);

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

export const BUDGET_MIN_YEAR = 2000;
export const BUDGET_MAX_YEAR = 2100;

export function validateBudgetInput(data: {
  categoryId?: unknown;
  amount?: unknown;
  month?: unknown;
  year?: unknown;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!isValidId(data.categoryId)) {
    errors.categoryId = "Kategori pengeluaran wajib dipilih";
  }

  if (data.amount === undefined || data.amount === null || data.amount === "") {
    errors.amount = "Nominal anggaran wajib diisi";
  } else {
    const normalized = normalizeAmount(data.amount);
    if (normalized === null) {
      errors.amount =
        typeof data.amount === "number" && data.amount <= 0
          ? "Nominal anggaran harus lebih besar dari 0"
          : "Nominal harus berupa angka valid (maksimal 2 angka desimal)";
    } else if (!/[1-9]/.test(normalized)) {
      errors.amount = "Nominal anggaran harus lebih besar dari 0";
    }
  }

  const month = Number(data.month);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    errors.month = "Bulan harus antara 1 dan 12";
  }

  const year = Number(data.year);
  if (!Number.isInteger(year) || year < BUDGET_MIN_YEAR || year > BUDGET_MAX_YEAR) {
    errors.year = `Tahun harus antara ${BUDGET_MIN_YEAR} dan ${BUDGET_MAX_YEAR}`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
