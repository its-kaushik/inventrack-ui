import { api } from './client';
import type { ApiResponse } from '@/types/api';
import type { CatalogItem, OfflineCustomer, OfflineBill } from '@/workers/offline-db';

// ── Types ──

export interface CatalogSyncResponse {
  variants: CatalogItem[];
  customers: OfflineCustomer[];
  settings: Record<string, unknown>;
  syncTimestamp: string;
}

export interface BillSyncResult {
  clientId: string;
  status: 'synced' | 'skipped' | 'conflict';
  saleId?: string;
  error?: string;
}

export interface SyncBillsResponse {
  results: BillSyncResult[];
  syncedCount: number;
  skippedCount: number;
  conflictCount: number;
}

export interface SyncConflict {
  id: string;
  tenantId: string;
  conflictType: 'negative_stock' | 'duplicate_customer' | 'stale_price' | 'bill_number_collision';
  description: string;
  entityType: string;
  entityId: string;
  billClientId: string | null;
  billNumber: string | null;
  localData: Record<string, unknown> | null;
  serverData: Record<string, unknown> | null;
  status: 'unresolved' | 'resolved';
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface ResolveConflictRequest {
  resolution: 'acknowledge' | 'create_adjustment' | 'void_rebill' | 'merge' | 'keep_server';
  notes?: string;
}

// ── API functions ──

export const syncApi = {
  getCatalog: (since?: string) =>
    api.get('sync/catalog', { searchParams: since ? { since } : {} }).json<ApiResponse<CatalogSyncResponse>>(),

  uploadBills: (bills: OfflineBill[]) =>
    api.post('sync/bills', { json: { bills } }).json<ApiResponse<SyncBillsResponse>>(),

  getConflicts: () =>
    api.get('sync/conflicts').json<ApiResponse<SyncConflict[]>>(),

  resolveConflict: (id: string, data: ResolveConflictRequest) =>
    api.post(`sync/conflicts/${id}/resolve`, { json: data }).json<ApiResponse<SyncConflict>>(),
};
