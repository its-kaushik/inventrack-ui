import { useQuery } from '@tanstack/react-query';
import { creditApi } from '@/api/credit.api';

export function useCustomerKhataSummary(params?: { agingBucket?: string; sortBy?: string }) {
  return useQuery({
    queryKey: ['credit', 'customers', params],
    queryFn: () => creditApi.getCustomerKhataSummary(params).then((r) => r.data),
  });
}

export function useSupplierPayablesSummary(params?: { agingBucket?: string; sortBy?: string }) {
  return useQuery({
    queryKey: ['credit', 'suppliers', params],
    queryFn: () => creditApi.getSupplierPayablesSummary(params).then((r) => r.data),
  });
}
