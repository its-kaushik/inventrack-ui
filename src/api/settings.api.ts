import { api } from './client';
import type { ApiResponse } from '@/types/api';
import type { Tenant, TenantSettings, User } from '@/types/models';
import type { GstScheme } from '@/types/enums';

// ── Settings types ──

export interface GstConfig {
  id: string;
  tenantId: string;
  gstin: string | null;
  gstScheme: GstScheme;
  stateCode: string | null;
  isActive: boolean;
}

export interface UpdateSettingsRequest {
  defaultBillDiscountPct?: string;
  maxDiscountPct?: string;
  returnWindowDays?: number;
  shelfAgingThresholdDays?: number;
  billNumberPrefix?: string;
  receiptFooterMessage?: string;
  receiptShowReturnPolicy?: boolean;
  voidWindowHours?: number;
}

export interface UpdateTenantRequest {
  name?: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
}

export interface UpdateGstRequest {
  gstScheme?: GstScheme;
  gstin?: string | null;
  stateCode?: string | null;
}

export interface InviteUserRequest {
  name: string;
  email: string;
  phone: string;
  role: string;
}

// ── API functions ──

export const settingsApi = {
  // Tenant settings
  getSettings: () =>
    api.get('settings').json<ApiResponse<TenantSettings & { tenant: Tenant }>>(),

  updateSettings: (data: UpdateSettingsRequest) =>
    api.patch('settings', { json: data }).json<ApiResponse<TenantSettings>>(),

  updateTenant: (data: UpdateTenantRequest) =>
    api.patch('settings', { json: data }).json<ApiResponse<Tenant>>(),

  // GST
  getGstConfig: () =>
    api.get('settings/gst').json<ApiResponse<GstConfig>>(),

  updateGstConfig: (data: UpdateGstRequest) =>
    api.patch('settings/gst', { json: data }).json<ApiResponse<GstConfig>>(),

  // Users
  getUsers: () =>
    api.get('users').json<ApiResponse<User[]>>(),

  inviteUser: (data: InviteUserRequest) =>
    api.post('users/invite', { json: data }).json<ApiResponse<{ inviteLink: string }>>(),

  updateUser: (id: string, data: Partial<Pick<User, 'name' | 'role' | 'isActive'>>) =>
    api.patch(`users/${id}`, { json: data }).json<ApiResponse<User>>(),

  deactivateUser: (id: string) =>
    api.delete(`users/${id}`),
};
