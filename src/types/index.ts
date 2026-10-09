export type TransactionType = "INCOME" | "EXPENSE";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface AuthSessionPayload {
  userId: string;
  email: string;
  name: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
  color?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: {
    transactions: number;
  };
}

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  type: TransactionType;
  amount: number | string;
  title: string;
  description?: string | null;
  date: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  category?: Category;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  netSavings: number;
  incomeCount: number;
  expenseCount: number;
  totalCount: number;
}

export interface DashboardSummaryData {
  summary: TransactionSummary;
  recentTransactions: Transaction[];
}

export interface TransactionFilters {
  search?: string;
  type?: "ALL" | TransactionType;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  sort?: "newest" | "oldest";
  page?: number;
  limit?: number;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NavItem {
  name: string;
  href: string;
  iconName: string;
  disabled?: boolean;
  badge?: string;
}

export interface StatCardData {
  title: string;
  value: string;
  description: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  iconName: "wallet" | "trending-up" | "trending-down" | "piggy-bank";
}
