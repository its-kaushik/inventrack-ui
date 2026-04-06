import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  inventoryApi,
  type StockAdjustRequest,
  type StockCountRequest,
} from '@/api/inventory.api';
import { toast } from 'sonner';

export function useStockLevels(params?: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['inventory', 'stock-levels', params],
    queryFn: () => inventoryApi.listStockLevels(params),
  });
}

export function useStockAdjust() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: StockAdjustRequest) => inventoryApi.adjust(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stock adjusted');
    },
    onError: () => toast.error('Failed to adjust stock'),
  });
}

export function useStockMovements(variantId: string, params?: { startDate?: string; endDate?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['inventory', 'movements', variantId, params],
    queryFn: () => inventoryApi.getMovements(variantId, params),
    enabled: !!variantId,
  });
}

export function useStockCount() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: StockCountRequest) => inventoryApi.submitStockCount(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      const { matched, discrepancies } = res.data;
      toast.success(`Stock count complete. ${matched} matched, ${discrepancies} discrepancies.`);
    },
    onError: () => toast.error('Failed to submit stock count'),
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => inventoryApi.getLowStock().then((r) => r.data),
  });
}

export function useAgingStock() {
  return useQuery({
    queryKey: ['inventory', 'aging'],
    queryFn: () => inventoryApi.getAgingStock().then((r) => r.data),
  });
}
