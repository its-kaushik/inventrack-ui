import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  salesApi,
  type SaleListParams,
  type CreateSaleRequest,
  type ParkBillRequest,
} from '@/api/sales.api';
import { useCartStore } from '@/stores/cart.store';
import { toast } from 'sonner';

export function useSales(params?: SaleListParams) {
  return useQuery({
    queryKey: ['sales', params],
    queryFn: () => salesApi.list(params),
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: () => salesApi.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  const clearCart = useCartStore.getState().clearCart;

  return useMutation({
    mutationFn: (data: CreateSaleRequest) => salesApi.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      clearCart();
      return res.data;
    },
    onError: () => toast.error('Failed to create sale'),
  });
}

export function useVoidSale() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason, approvalToken }: { id: string; reason: string; approvalToken: string }) =>
      salesApi.void(id, { reason, approvalToken }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Bill voided');
    },
    onError: () => toast.error('Failed to void bill'),
  });
}

// ── Parked Bills ──

export function useParkedBills() {
  return useQuery({
    queryKey: ['sales', 'parked'],
    queryFn: () => salesApi.listParked().then((r) => r.data),
  });
}

export function useParkBill() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: ParkBillRequest) => salesApi.park(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales', 'parked'] });
      useCartStore.getState().clearCart();
      toast.success('Bill parked');
    },
    onError: () => toast.error('Failed to park bill'),
  });
}

export function useRecallBill() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salesApi.recall(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales', 'parked'] });
    },
    onError: () => toast.error('Failed to recall bill'),
  });
}

export function useDeleteParkedBill() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salesApi.deleteParked(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales', 'parked'] });
      toast.success('Parked bill deleted');
    },
    onError: () => toast.error('Failed to delete parked bill'),
  });
}

/** Verify owner PIN for discount override or bill void. */
export function useVerifyPin() {
  return useMutation({
    mutationFn: async (pin: string) => {
      const { authApi } = await import('@/api/auth.api');
      const res = await authApi.verifyPin(pin);
      return res;
    },
    onError: () => toast.error('Invalid PIN'),
  });
}
