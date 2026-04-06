import { api } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Product, ProductVariant, Category, Brand } from '@/types/models';

// ── Request types ──

export interface ProductListParams {
  search?: string;
  categoryId?: string;
  brandId?: string;
  isArchived?: string;
  page?: number;
  limit?: number;
}

export interface CreateProductRequest {
  name: string;
  brandId: string;
  categoryId: string;
  hsnCode?: string | null;
  description?: string | null;
  hasVariants: boolean;
  productDiscountPct?: number;
  gstRate?: string | null;
  /** For simple products */
  costPrice?: number;
  mrp?: number;
  initialQuantity?: number;
  lowStockThreshold?: number | null;
  /** For variant products */
  variants?: CreateVariantInput[];
}

export interface CreateVariantInput {
  attributes: Record<string, string>;
  costPrice: number;
  mrp: number;
  initialQuantity: number;
  lowStockThreshold?: number | null;
}

export interface UpdateProductRequest {
  name?: string;
  brandId?: string;
  categoryId?: string;
  hsnCode?: string | null;
  description?: string | null;
  productDiscountPct?: number;
  gstRate?: string | null;
}

export interface ProductDetail extends Product {
  variants: ProductVariant[];
  images: ProductImage[];
  category?: Category;
  brand?: Brand;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface HsnCode {
  code: string;
  description: string;
}

export interface BulkImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

// ── API functions ──

export const productsApi = {
  // Products
  list: (params?: ProductListParams) =>
    api.get('products', { searchParams: params as Record<string, string> }).json<PaginatedResponse<Product>>(),

  get: (id: string) =>
    api.get(`products/${id}`).json<ApiResponse<ProductDetail>>(),

  create: (data: CreateProductRequest) =>
    api.post('products', { json: data }).json<ApiResponse<ProductDetail>>(),

  update: (id: string, data: UpdateProductRequest) =>
    api.patch(`products/${id}`, { json: data }).json<ApiResponse<Product>>(),

  archive: (id: string) =>
    api.delete(`products/${id}`),

  unarchive: (id: string) =>
    api.post(`products/${id}/unarchive`).json<ApiResponse<Product>>(),

  // Images
  getUploadUrl: (productId: string, fileName: string) =>
    api.post(`products/${productId}/images/upload-url`, { json: { fileName } })
      .json<ApiResponse<{ uploadUrl: string; key: string }>>(),

  confirmImage: (productId: string, data: { key: string; isPrimary?: boolean }) =>
    api.post(`products/${productId}/images`, { json: data }).json<ApiResponse<ProductImage>>(),

  deleteImage: (productId: string, imageId: string) =>
    api.delete(`products/${productId}/images/${imageId}`),

  // Categories
  listCategories: () =>
    api.get('products/categories').json<ApiResponse<Category[]>>(),

  createCategory: (data: { name: string; parentId?: string | null }) =>
    api.post('products/categories', { json: data }).json<ApiResponse<Category>>(),

  // Brands
  listBrands: () =>
    api.get('products/brands').json<ApiResponse<Brand[]>>(),

  createBrand: (data: { name: string }) =>
    api.post('products/brands', { json: data }).json<ApiResponse<Brand>>(),

  // HSN Codes
  searchHsnCodes: (search: string) =>
    api.get('products/hsn-codes', { searchParams: { search } }).json<ApiResponse<HsnCode[]>>(),

  // Bulk import
  downloadTemplate: () =>
    api.get('migration/templates/products').blob(),

  bulkImport: (data: FormData) =>
    api.post('migration/import/products', { body: data }).json<ApiResponse<BulkImportResult>>(),
};
