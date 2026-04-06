import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  purchasesApi,
  type GoodsReceiptListParams,
  type CreateGoodsReceiptRequest,
  type CreatePurchaseReturnRequest,
} from '@/api/purchases.api';
import { toast } from 'sonner';

export function useGoodsReceipts(params?: GoodsReceiptListParams) {
  return useQuery({
    queryKey: ['goods-receipts', params],
    queryFn: () => purchasesApi.listReceipts(params),
  });
}

export function useGoodsReceipt(id: string) {
  return useQuery({
    queryKey: ['goods-receipts', id],
    queryFn: () => purchasesApi.getReceipt(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateGoodsReceipt() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGoodsReceiptRequest) => purchasesApi.createReceipt(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['goods-receipts'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      const count = res.data.totalQuantity;
      toast.success(`Stock received: ${count} items added`);
    },
    onError: () => toast.error('Failed to record goods receipt'),
  });
}

export function useCreatePurchaseReturn() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePurchaseReturnRequest) => purchasesApi.createReturn(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goods-receipts'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Purchase return recorded');
    },
    onError: () => toast.error('Failed to record purchase return'),
  });
}
