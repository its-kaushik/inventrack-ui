import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  suppliersApi,
  type SupplierListParams,
  type CreateSupplierRequest,
  type UpdateSupplierRequest,
  type RecordPaymentRequest,
} from '@/api/suppliers.api';
import { toast } from 'sonner';

export function useSuppliers(params?: SupplierListParams) {
  return useQuery({
    queryKey: ['suppliers', params],
    queryFn: () => suppliersApi.list(params),
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ['suppliers', id],
    queryFn: () => suppliersApi.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSupplierRequest) => suppliersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier created');
    },
    onError: () => toast.error('Failed to create supplier'),
  });
}

export function useUpdateSupplier(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSupplierRequest) => suppliersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      qc.invalidateQueries({ queryKey: ['suppliers', id] });
      toast.success('Supplier updated');
    },
    onError: () => toast.error('Failed to update supplier'),
  });
}

export function useDeactivateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suppliersApi.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier deactivated');
    },
    onError: () => toast.error('Failed to deactivate supplier'),
  });
}

export function useSupplierLedger(id: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['suppliers', id, 'ledger', params],
    queryFn: () => suppliersApi.getLedger(id, params),
    enabled: !!id,
  });
}

export function useRecordSupplierPayment(supplierId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordPaymentRequest) => suppliersApi.recordPayment(supplierId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      qc.invalidateQueries({ queryKey: ['suppliers', supplierId] });
      qc.invalidateQueries({ queryKey: ['suppliers', supplierId, 'ledger'] });
      toast.success('Payment recorded');
    },
    onError: () => toast.error('Failed to record payment'),
  });
}
