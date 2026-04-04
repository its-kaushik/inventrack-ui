import type { Product } from '@/types/models'
import type { PaginatedResponse } from '@/types/api'
import { apiGet, apiPost, apiPut, apiDelete } from '@/api/client'

export interface ProductFilters {
  category_id?: string
  brand_id?: string
  search?: string
  is_active?: boolean
  limit?: number
  offset?: number
  updated_after?: string
}

export function listProducts(filters?: ProductFilters) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) params.set(key, String(value))
    })
  }
  const qs = params.toString()
  return apiGet<PaginatedResponse<Product>>(`/products${qs ? `?${qs}` : ''}`)
}

// NOTE: The search endpoint may also return a `similarity` score field per result.
// This is not part of the core Product type. If the UI needs to display it,
// define a `ProductSearchResult` type extending Product with `similarity?: number`.
export function searchProducts(query: string) {
  return apiGet<Product[]>(`/products/search?q=${encodeURIComponent(query)}`)
}

export function getProduct(id: string) {
  return apiGet<Product>(`/products/${id}`)
}

export function createProduct(data: {
  name: string
  sku: string
  barcode?: string
  categoryId: string
  subTypeId?: string | null
  brandId?: string | null
  size?: string | null
  color?: string | null
  hsnCode?: string | null
  gstRate?: number
  sellingPrice: number
  costPrice?: number
  mrp?: number | null
  catalogDiscountPct?: number
  minStockLevel?: number
  reorderPoint?: number | null
  description?: string | null
  imageUrls?: string[]
}) {
  return apiPost<Product>('/products', data)
}

export function updateProduct(
  id: string,
  data: Partial<{
    name: string
    sku: string
    barcode: string
    categoryId: string
    subTypeId: string | null
    brandId: string | null
    size: string | null
    color: string | null
    hsnCode: string | null
    gstRate: number
    sellingPrice: number
    costPrice: number
    mrp: number | null
    catalogDiscountPct: number
    minStockLevel: number
    reorderPoint: number | null
    description: string | null
    imageUrls: string[]
    isActive: boolean
  }>,
) {
  return apiPut<Product>(`/products/${id}`, data)
}

export function deleteProduct(id: string) {
  return apiDelete<void>(`/products/${id}`)
}

export function generateBarcode(id: string) {
  return apiPost<{ barcode: string }>(`/products/${id}/barcode`)
}

export function getImportJobStatus(jobId: string) {
  return apiGet<{ jobId: string; status: string; progress: number; errors?: string[] }>(`/products/import/${jobId}/status`)
}
