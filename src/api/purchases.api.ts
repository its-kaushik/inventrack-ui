import { api } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { ReceiptPaymentMode } from '@/types/enums';

// ── Goods Receipt types ──

export interface GoodsReceipt {
  id: string;
  tenantId: string;
  receiptNumber: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderId: string | null;
  supplierInvoiceNumber: string | null;
  supplierInvoiceDate: string | null;
  paymentMode: ReceiptPaymentMode;
  totalAmount: string;
  totalQuantity: number;
  invoiceImageUrl: string | null;
  notes: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface GoodsReceiptItem {
  id: string;
  receiptId: string;
  variantId: string;
  productName: string;
  variantDescription: string;
  sku: string;
  quantityReceived: number;
  costPrice: string;
  gstRate: string | null;
  lineTotal: string;
}

export interface GoodsReceiptDetail extends GoodsReceipt {
  items: GoodsReceiptItem[];
}

export interface CreateGoodsReceiptRequest {
  supplierId: string;
  purchaseOrderId?: string | null;
  supplierInvoiceNumber?: string | null;
  supplierInvoiceDate?: string | null;
  paymentMode: ReceiptPaymentMode;
  notes?: string | null;
  items: CreateReceiptItemInput[];
}

export interface CreateReceiptItemInput {
  variantId: string;
  quantityReceived: number;
  costPrice: number;
  gstRate?: number | null;
}

export interface GoodsReceiptListParams {
  supplierId?: string;
  page?: number;
  limit?: number;
}

// ── Purchase Return types ──

export interface PurchaseReturn {
  id: string;
  tenantId: string;
  returnNumber: string;
  supplierId: string;
  supplierName: string;
  receiptId: string | null;
  totalAmount: string;
  totalQuantity: number;
  reason: string | null;
  status: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface CreatePurchaseReturnRequest {
  supplierId: string;
  receiptId?: string | null;
  reason?: string | null;
  items: { variantId: string; quantity: number; costPrice: number }[];
}

// ── API functions ──

export const purchasesApi = {
  // Goods Receipts
  listReceipts: (params?: GoodsReceiptListParams) =>
    api.get('goods-receipts', { searchParams: params as Record<string, string> }).json<PaginatedResponse<GoodsReceipt>>(),

  getReceipt: (id: string) =>
    api.get(`goods-receipts/${id}`).json<ApiResponse<GoodsReceiptDetail>>(),

  createReceipt: (data: CreateGoodsReceiptRequest) =>
    api.post('goods-receipts', { json: data }).json<ApiResponse<GoodsReceiptDetail>>(),

  // Purchase Returns
  createReturn: (data: CreatePurchaseReturnRequest) =>
    api.post('purchase-orders/returns', { json: data }).json<ApiResponse<PurchaseReturn>>(),
};
