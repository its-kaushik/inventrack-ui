import { api } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { ReturnType, RefundMode, ReturnReason } from '@/types/enums';

// ── Types ──

export interface SaleReturn {
  id: string;
  tenantId: string;
  returnNumber: string;
  originalSaleId: string;
  originalBillNumber: string;
  customerId: string;
  customerName: string;
  returnType: ReturnType;
  refundMode: RefundMode;
  totalRefundAmount: string;
  exchangeSaleId: string | null;
  notes: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface SaleReturnItem {
  id: string;
  returnId: string;
  originalSaleItemId: string;
  variantId: string;
  productName: string;
  variantDescription: string | null;
  quantity: number;
  refundPrice: string;
  reason: ReturnReason;
}

export interface SaleReturnDetail extends SaleReturn {
  items: SaleReturnItem[];
}

export interface CreateReturnRequest {
  originalSaleId: string;
  returnType: ReturnType;
  refundMode: RefundMode;
  items: CreateReturnItemInput[];
  exchangeItems?: ExchangeItemInput[];
  notes?: string | null;
}

export interface CreateReturnItemInput {
  originalSaleItemId: string;
  variantId: string;
  quantity: number;
  reason: ReturnReason;
}

export interface ExchangeItemInput {
  variantId: string;
  quantity: number;
  mrp: number;
  costPrice: number;
  productDiscountPct: number;
  gstRate: number;
  hsnCode?: string | null;
  version: number;
}

export interface ReturnListParams {
  search?: string;
  page?: number;
  limit?: number;
}

// ── API functions ──

export const returnsApi = {
  list: (params?: ReturnListParams) =>
    api.get('sales/returns', { searchParams: params as Record<string, string> }).json<PaginatedResponse<SaleReturn>>(),

  get: (id: string) =>
    api.get(`sales/returns/${id}`).json<ApiResponse<SaleReturnDetail>>(),

  create: (data: CreateReturnRequest) =>
    api.post('sales/returns', { json: data }).json<ApiResponse<SaleReturnDetail>>(),
};
