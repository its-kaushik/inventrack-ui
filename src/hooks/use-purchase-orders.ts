import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  purchaseOrdersApi,
  type POListParams,
  type CreatePORequest,
  type UpdatePORequest,
} from '@/api/purchase-orders.api';
import { toast } from 'sonner';

export function usePurchaseOrders(params?: POListParams) {
  return useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: () => purchaseOrdersApi.list(params),
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: () => purchaseOrdersApi.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePORequest) => purchaseOrdersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Purchase order created');
    },
    onError: () => toast.error('Failed to create purchase order'),
  });
}

export function useUpdatePurchaseOrder(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePORequest) => purchaseOrdersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['purchase-orders', id] });
      toast.success('Purchase order updated');
    },
    onError: () => toast.error('Failed to update purchase order'),
  });
}

export function useSendPurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.send(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Purchase order sent to supplier');
    },
    onError: () => toast.error('Failed to send purchase order'),
  });
}

export function useCancelPurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Purchase order cancelled');
    },
    onError: () => toast.error('Failed to cancel purchase order'),
  });
}
