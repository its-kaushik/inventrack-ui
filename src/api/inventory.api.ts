import { api } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { ProductVariant } from '@/types/models';
import type { MovementType, AdjustmentReason } from '@/types/enums';

// ── Types ──

export interface StockLevel {
  variantId: string;
  productId: string;
  productName: string;
  variantDescription: string;
  sku: string;
  barcode: string;
  availableQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number | null;
  weightedAvgCost: string;
  mrp: string;
}

export interface StockMovement {
  id: string;
  variantId: string;
  movementType: MovementType;
  quantity: number;
  balanceAfter: number;
  reference: string | null;
  referenceId: string | null;
  notes: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface StockAdjustRequest {
  variantId: string;
  quantity: number;
  reason: AdjustmentReason;
  notes: string;
}

export interface StockCountItem {
  variantId: string;
  expectedQuantity: number;
  actualQuantity: number;
}

export interface StockCountRequest {
  items: StockCountItem[];
  notes?: string;
}

export interface StockCountResult {
  totalCounted: number;
  matched: number;
  discrepancies: number;
  adjustmentsCreated: number;
  items: StockCountVarianceItem[];
}

export interface StockCountVarianceItem {
  variantId: string;
  productName: string;
  variantDescription: string;
  sku: string;
  expected: number;
  actual: number;
  variance: number;
  adjusted: boolean;
}

export interface LowStockItem {
  variantId: string;
  productId: string;
  productName: string;
  variantDescription: string;
  sku: string;
  availableQuantity: number;
  lowStockThreshold: number;
}

export interface AgingStockItem {
  variantId: string;
  productId: string;
  productName: string;
  variantDescription: string;
  sku: string;
  availableQuantity: number;
  oldestStockDate: string;
  ageDays: number;
  costValue: string;
}

// ── API functions ──

export const inventoryApi = {
  listStockLevels: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('inventory', { searchParams: params as Record<string, string> }).json<PaginatedResponse<StockLevel>>(),

  adjust: (data: StockAdjustRequest) =>
    api.post('inventory/adjust', { json: data }).json<ApiResponse<{ movementId: string }>>(),

  getMovements: (variantId: string, params?: { startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    api.get(`inventory/${variantId}/movements`, { searchParams: params as Record<string, string> }).json<PaginatedResponse<StockMovement>>(),

  submitStockCount: (data: StockCountRequest) =>
    api.post('inventory/stock-count', { json: data }).json<ApiResponse<StockCountResult>>(),

  getLowStock: () =>
    api.get('inventory/low-stock').json<ApiResponse<LowStockItem[]>>(),

  getAgingStock: () =>
    api.get('inventory/aging').json<ApiResponse<AgingStockItem[]>>(),
};
