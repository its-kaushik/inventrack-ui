import { api } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Customer } from '@/types/models';

// ── Request types ──

export interface CustomerListParams {
  search?: string;
  sortBy?: 'name' | 'recent_visit' | 'total_spend';
  page?: number;
  limit?: number;
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
  notes?: string | null;
}

export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;

export interface RecordCustomerPaymentRequest {
  amount: number;
  paymentMode: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  referenceNumber?: string | null;
  notes?: string | null;
  paymentDate?: string;
}

export interface CustomerLedgerEntry {
  id: string;
  customerId: string;
  transactionType: string;
  referenceId: string | null;
  referenceNumber: string | null;
  debit: string | null;
  credit: string | null;
  balance: string;
  notes: string | null;
  createdAt: string;
}

export interface CustomerPurchase {
  id: string;
  billNumber: string;
  saleDate: string;
  netPayable: string;
  status: string;
  itemCount: number;
}

// ── API functions ──

export const customersApi = {
  list: (params?: CustomerListParams) =>
    api.get('customers', { searchParams: params as Record<string, string> }).json<PaginatedResponse<Customer>>(),

  get: (id: string) =>
    api.get(`customers/${id}`).json<ApiResponse<Customer>>(),

  create: (data: CreateCustomerRequest) =>
    api.post('customers', { json: data }).json<ApiResponse<Customer>>(),

  update: (id: string, data: UpdateCustomerRequest) =>
    api.patch(`customers/${id}`, { json: data }).json<ApiResponse<Customer>>(),

  getLedger: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`customers/${id}/ledger`, { searchParams: params as Record<string, string> }).json<PaginatedResponse<CustomerLedgerEntry>>(),

  recordPayment: (id: string, data: RecordCustomerPaymentRequest) =>
    api.post(`customers/${id}/payments`, { json: data }).json<ApiResponse<{ id: string }>>(),
};
