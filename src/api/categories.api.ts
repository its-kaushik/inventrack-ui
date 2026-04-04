import type { Category, SubType, SizeSystem, Brand } from '@/types/models'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/api/client'

// --- Categories ---

export function listCategories() {
  return apiGet<Category[]>('/categories')
}

export function createCategory(data: { name: string; code: string; sortOrder?: number }) {
  return apiPost<Category>('/categories', data)
}

export function updateCategory(
  id: string,
  data: Partial<{ name: string; code: string; sortOrder: number; isActive: boolean }>,
) {
  return apiPatch<Category>(`/categories/${id}`, data)
}

export function deleteCategory(id: string) {
  return apiDelete<void>(`/categories/${id}`)
}

// --- Sub-Types ---

export function listSubTypes(categoryId: string) {
  return apiGet<SubType[]>(`/categories/${categoryId}/sub-types`)
}

export function createSubType(data: { categoryId: string; name: string; code: string }) {
  return apiPost<SubType>('/sub-types', data)
}

export function updateSubType(
  id: string,
  data: Partial<{ name: string; code: string }>,
) {
  return apiPatch<SubType>(`/sub-types/${id}`, data)
}

// --- Size Systems ---

export function listSizeSystems() {
  return apiGet<SizeSystem[]>('/size-systems')
}

export function createSizeSystem(data: { name: string; values: string[] }) {
  return apiPost<SizeSystem>('/size-systems', data)
}

export function updateSizeSystem(
  id: string,
  data: Partial<{ name: string; values: string[] }>,
) {
  return apiPatch<SizeSystem>(`/size-systems/${id}`, data)
}

// --- Brands ---

export function listBrands() {
  return apiGet<Brand[]>('/brands')
}

export function createBrand(data: { name: string; code: string }) {
  return apiPost<Brand>('/brands', data)
}

export function updateBrand(
  id: string,
  data: Partial<{ name: string; code: string }>,
) {
  return apiPatch<Brand>(`/brands/${id}`, data)
}
