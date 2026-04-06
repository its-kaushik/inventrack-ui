import { api } from './client';
import type { ApiResponse } from '@/types/api';

// ── Types ──

export interface KhataCustomer {
  id: string;
  name: string;
  phone: string;
  outstandingBalance: string;
  lastPaymentDate: string | null;
  oldestDueDate: string | null;
  agingDays: number;
}

export interface KhataSupplier {
  id: string;
  name: string;
  phone: string | null;
  contactPerson: string | null;
  outstandingBalance: string;
  lastPaymentDate: string | null;
  nextDueDate: string | null;
  agingDays: number;
  paymentTerms: string;
}

export interface CreditSummary {
  totalOutstanding: string;
  count: number;
  aging: {
    bucket: string;
    label: string;
    count: number;
    amount: string;
  }[];
}

export interface CustomerKhataSummaryResponse {
  summary: CreditSummary;
  customers: KhataCustomer[];
}

export interface SupplierPayablesSummaryResponse {
  summary: CreditSummary;
  suppliers: KhataSupplier[];
}

// ── API functions ──

export const creditApi = {
  getCustomerKhataSummary: (params?: { agingBucket?: string; sortBy?: string }) =>
    api.get('credit/customers/summary', { searchParams: params as Record<string, string> })
      .json<ApiResponse<CustomerKhataSummaryResponse>>(),

  getSupplierPayablesSummary: (params?: { agingBucket?: string; sortBy?: string }) =>
    api.get('credit/suppliers/summary', { searchParams: params as Record<string, string> })
      .json<ApiResponse<SupplierPayablesSummaryResponse>>(),
};
