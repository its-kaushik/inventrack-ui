import { api } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Supplier } from '@/types/models';
import type { SupplierPaymentTerms } from '@/types/enums';

// ── Request types ──

export interface SupplierListParams {
  search?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
  pan?: string | null;
  paymentTerms?: SupplierPaymentTerms;
}

export type UpdateSupplierRequest = Partial<CreateSupplierRequest>;

export interface RecordPaymentRequest {
  amount: number;
  paymentMode: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  referenceNumber?: string | null;
  notes?: string | null;
  paymentDate?: string;
}

export interface LedgerEntry {
  id: string;
  supplierId: string;
  transactionType: string;
  referenceId: string | null;
  referenceNumber: string | null;
  debit: string | null;
  credit: string | null;
  balance: string;
  notes: string | null;
  createdAt: string;
}

// ── API functions ──

export const suppliersApi = {
  list: (params?: SupplierListParams) =>
    api.get('suppliers', { searchParams: params as Record<string, string> }).json<PaginatedResponse<Supplier>>(),

  get: (id: string) =>
    api.get(`suppliers/${id}`).json<ApiResponse<Supplier>>(),

  create: (data: CreateSupplierRequest) =>
    api.post('suppliers', { json: data }).json<ApiResponse<Supplier>>(),

  update: (id: string, data: UpdateSupplierRequest) =>
    api.patch(`suppliers/${id}`, { json: data }).json<ApiResponse<Supplier>>(),

  deactivate: (id: string) =>
    api.delete(`suppliers/${id}`),

  getLedger: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`suppliers/${id}/ledger`, { searchParams: params as Record<string, string> }).json<PaginatedResponse<LedgerEntry>>(),

  recordPayment: (id: string, data: RecordPaymentRequest) =>
    api.post(`suppliers/${id}/payments`, { json: data }).json<ApiResponse<{ id: string }>>(),
};
