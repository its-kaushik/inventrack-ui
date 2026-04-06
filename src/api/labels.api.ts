import { api } from './client';
import type { ApiResponse } from '@/types/api';

// ── Types ──

export interface LabelTemplate {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  description: string;
}

export interface GenerateLabelRequest {
  templateId: string;
  items: LabelItem[];
}

export interface LabelItem {
  variantId: string;
  productName: string;
  variantDescription: string;
  sku: string;
  barcode: string;
  mrp: number;
  quantity: number;
}

// ── API functions ──

export const labelsApi = {
  listTemplates: () =>
    api.get('labels/templates').json<ApiResponse<LabelTemplate[]>>(),

  generatePdf: (data: GenerateLabelRequest) =>
    api.post('labels/generate', { json: data }).blob(),
};
