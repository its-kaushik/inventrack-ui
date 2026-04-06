import { api } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Sale, SaleItem, SalePayment } from '@/types/models';
import type { PaymentMethod } from '@/types/enums';

// ── Request types ──

export interface CreateSaleRequest {
  customerId: string;
  items: CreateSaleItemInput[];
  billDiscountPct: number;
  bargainAdjustment: number;
  finalPrice?: number;
  payments: { method: PaymentMethod; amount: number }[];
  approvalToken?: string | null;
  clientId?: string;
  notes?: string | null;
}

export interface CreateSaleItemInput {
  variantId: string;
  quantity: number;
  mrp: number;
  productDiscountPct: number;
  costPrice: number;
  hsnCode?: string | null;
  gstRate?: number;
  version: number;
}

export interface SaleDetail extends Sale {
  items: SaleItem[];
  payments: SalePayment[];
  customer?: { id: string; name: string; phone: string };
}

export interface SaleListParams {
  search?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ParkedBill {
  id: string;
  tenantId: string;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  billData: string;
  itemCount: number;
  totalAmount: string;
  parkedAt: string;
  expiresAt: string | null;
  createdBy: string;
  createdByName: string;
}

export interface ParkBillRequest {
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  billData: string;
  itemCount: number;
  totalAmount: number;
}

// ── API functions ──

export const salesApi = {
  list: (params?: SaleListParams) =>
    api.get('sales', { searchParams: params as Record<string, string> }).json<PaginatedResponse<Sale>>(),

  get: (id: string) =>
    api.get(`sales/${id}`).json<ApiResponse<SaleDetail>>(),

  create: (data: CreateSaleRequest) =>
    api.post('sales', { json: data }).json<ApiResponse<SaleDetail>>(),

  void: (id: string, data: { reason: string; approvalToken: string }) =>
    api.post(`sales/${id}/void`, { json: data }).json<ApiResponse<Sale>>(),

  // Parked bills
  park: (data: ParkBillRequest) =>
    api.post('sales/park', { json: data }).json<ApiResponse<ParkedBill>>(),

  listParked: () =>
    api.get('sales/parked').json<ApiResponse<ParkedBill[]>>(),

  recall: (id: string) =>
    api.post(`sales/parked/${id}/recall`).json<ApiResponse<ParkedBill>>(),

  deleteParked: (id: string) =>
    api.delete(`sales/parked/${id}`),
};
