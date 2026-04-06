import { api } from './client';
import type { ApiResponse } from '@/types/api';

// ── Types ──

export interface MigrationResult {
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

// ── API functions ──

export const migrationApi = {
  downloadTemplate: (type: 'customers' | 'suppliers') =>
    api.get(`migration/templates/${type}`).blob(),

  importCustomers: (formData: FormData) =>
    api.post('migration/customers', { body: formData }).json<ApiResponse<MigrationResult>>(),

  importSuppliers: (formData: FormData) =>
    api.post('migration/suppliers', { body: formData }).json<ApiResponse<MigrationResult>>(),
};
