import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  productsApi,
  type ProductListParams,
  type CreateProductRequest,
  type UpdateProductRequest,
} from '@/api/products.api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// ── Products ──

export function useProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productsApi.list(params),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productsApi.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: CreateProductRequest) => productsApi.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created');
      return res.data;
    },
    onError: () => toast.error('Failed to create product'),
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProductRequest) => productsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products', id] });
      toast.success('Product updated');
    },
    onError: () => toast.error('Failed to update product'),
  });
}

export function useArchiveProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product archived');
    },
    onError: () => toast.error('Failed to archive product'),
  });
}

export function useUnarchiveProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.unarchive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product restored');
    },
    onError: () => toast.error('Failed to restore product'),
  });
}

// ── Categories ──

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.listCategories().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; parentId?: string | null }) =>
      productsApi.createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created');
    },
    onError: () => toast.error('Failed to create category'),
  });
}

// ── Brands ──

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: () => productsApi.listBrands().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string }) => productsApi.createBrand(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand created');
    },
    onError: () => toast.error('Failed to create brand'),
  });
}

// ── HSN Codes ──

export function useHsnCodes(search: string) {
  return useQuery({
    queryKey: ['hsn-codes', search],
    queryFn: () => productsApi.searchHsnCodes(search).then((r) => r.data),
    enabled: search.length >= 2,
  });
}

// ── Bulk Import ──

export function useBulkImport() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => productsApi.bulkImport(formData),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      const { imported, skipped } = res.data;
      toast.success(`Imported ${imported} products. ${skipped} skipped.`);
    },
    onError: () => toast.error('Import failed'),
  });
}
