import { api } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { ExpensePaymentMode } from '@/types/enums';

// ── Types ──

export interface Expense {
  id: string;
  tenantId: string;
  categoryId: string;
  categoryName: string;
  amount: string;
  description: string;
  expenseDate: string;
  paymentMode: ExpensePaymentMode;
  receiptImageUrl: string | null;
  notes: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
}

export interface CreateExpenseRequest {
  categoryId: string;
  amount: number;
  description: string;
  expenseDate: string;
  paymentMode: ExpensePaymentMode;
  notes?: string | null;
}

export interface ExpenseListParams {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}

export interface CashRegister {
  id: string;
  tenantId: string;
  date: string;
  openingBalance: string;
  closingBalance: string | null;
  totalCashSales: string;
  totalCashReceived: string;
  totalCashExpenses: string;
  totalCashPaidToSuppliers: string;
  expectedCash: string;
  actualCash: string | null;
  variance: string | null;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt: string | null;
  openedBy: string;
  openedByName: string;
  closedBy: string | null;
  closedByName: string | null;
  notes: string | null;
}

// ── API functions ──

export const expensesApi = {
  // Expenses
  list: (params?: ExpenseListParams) =>
    api.get('expenses', { searchParams: params as Record<string, string> }).json<PaginatedResponse<Expense>>(),

  get: (id: string) =>
    api.get(`expenses/${id}`).json<ApiResponse<Expense>>(),

  create: (data: CreateExpenseRequest) =>
    api.post('expenses', { json: data }).json<ApiResponse<Expense>>(),

  delete: (id: string) =>
    api.delete(`expenses/${id}`),

  // Categories
  listCategories: () =>
    api.get('expenses/categories').json<ApiResponse<ExpenseCategory[]>>(),

  createCategory: (data: { name: string }) =>
    api.post('expenses/categories', { json: data }).json<ApiResponse<ExpenseCategory>>(),

  // Cash Register
  openRegister: (data: { openingBalance: number; notes?: string }) =>
    api.post('cash-register/open', { json: data }).json<ApiResponse<CashRegister>>(),

  closeRegister: (data: { actualCash: number; notes?: string }) =>
    api.post('cash-register/close', { json: data }).json<ApiResponse<CashRegister>>(),

  getCurrentRegister: () =>
    api.get('cash-register/current').json<ApiResponse<CashRegister | null>>(),

  getRegisterByDate: (date: string) =>
    api.get(`cash-register/${date}`).json<ApiResponse<CashRegister>>(),
};
