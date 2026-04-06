import { api } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Tenant } from '@/types/models';
import type { GstScheme } from '@/types/enums';

// ── Types ──

export interface TenantDetail extends Tenant {
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  skuCount: number;
  transactionCount: number;
  userCount: number;
}

export interface CreateTenantRequest {
  name: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  gstScheme: GstScheme;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  gstin?: string | null;
}

export interface TenantListParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// ── API functions ──

export const adminApi = {
  listTenants: (params?: TenantListParams) =>
    api.get('admin/tenants', { searchParams: params as Record<string, string> }).json<PaginatedResponse<TenantDetail>>(),

  getTenant: (id: string) =>
    api.get(`admin/tenants/${id}`).json<ApiResponse<TenantDetail>>(),

  createTenant: (data: CreateTenantRequest) =>
    api.post('admin/tenants', { json: data }).json<ApiResponse<TenantDetail>>(),

  updateTenant: (id: string, data: Partial<CreateTenantRequest>) =>
    api.patch(`admin/tenants/${id}`, { json: data }).json<ApiResponse<Tenant>>(),

  deleteTenant: (id: string) =>
    api.delete(`admin/tenants/${id}`),

  suspendTenant: (id: string) =>
    api.post(`admin/tenants/${id}/suspend`).json<ApiResponse<Tenant>>(),

  reactivateTenant: (id: string) =>
    api.post(`admin/tenants/${id}/reactivate`).json<ApiResponse<Tenant>>(),
};
