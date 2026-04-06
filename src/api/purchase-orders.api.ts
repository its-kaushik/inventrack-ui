import { api } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { POStatus } from '@/types/enums';

// ── Types ──

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string | null;
  status: POStatus;
  subtotal: string;
  totalAmount: string;
  itemCount: number;
  receivedQuantity: number;
  totalQuantity: number;
  notes: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface POLineItem {
  id: string;
  purchaseOrderId: string;
  variantId: string;
  productName: string;
  variantDescription: string;
  sku: string;
  quantity: number;
  receivedQuantity: number;
  pendingQuantity: number;
  costPrice: string;
  lineTotal: string;
}

export interface PurchaseOrderDetail extends PurchaseOrder {
  items: POLineItem[];
  supplier: { id: string; name: string; phone: string | null; contactPerson: string | null };
}

export interface CreatePORequest {
  supplierId: string;
  expectedDeliveryDate?: string | null;
  notes?: string | null;
  items: { variantId: string; quantity: number; costPrice: number }[];
}

export type UpdatePORequest = Partial<Omit<CreatePORequest, 'supplierId'>>;

export interface POListParams {
  search?: string;
  supplierId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ── API functions ──

export const purchaseOrdersApi = {
  list: (params?: POListParams) =>
    api.get('purchase-orders', { searchParams: params as Record<string, string> }).json<PaginatedResponse<PurchaseOrder>>(),

  get: (id: string) =>
    api.get(`purchase-orders/${id}`).json<ApiResponse<PurchaseOrderDetail>>(),

  create: (data: CreatePORequest) =>
    api.post('purchase-orders', { json: data }).json<ApiResponse<PurchaseOrderDetail>>(),

  update: (id: string, data: UpdatePORequest) =>
    api.patch(`purchase-orders/${id}`, { json: data }).json<ApiResponse<PurchaseOrder>>(),

  send: (id: string) =>
    api.post(`purchase-orders/${id}/send`).json<ApiResponse<PurchaseOrder>>(),

  cancel: (id: string) =>
    api.post(`purchase-orders/${id}/cancel`).json<ApiResponse<PurchaseOrder>>(),
};
