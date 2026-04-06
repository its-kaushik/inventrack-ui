import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  customersApi,
  type CustomerListParams,
  type CreateCustomerRequest,
  type UpdateCustomerRequest,
  type RecordCustomerPaymentRequest,
} from '@/api/customers.api';
import { toast } from 'sonner';

export function useCustomers(params?: CustomerListParams) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customersApi.list(params),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => customersApi.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => customersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message;
      if (msg?.toLowerCase().includes('duplicate') || msg?.toLowerCase().includes('phone')) {
        toast.error('A customer with this phone number already exists');
      } else {
        toast.error('Failed to create customer');
      }
    },
  });
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCustomerRequest) => customersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customers', id] });
      toast.success('Customer updated');
    },
    onError: () => toast.error('Failed to update customer'),
  });
}

export function useCustomerLedger(id: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['customers', id, 'ledger', params],
    queryFn: () => customersApi.getLedger(id, params),
    enabled: !!id,
  });
}

export function useRecordCustomerPayment(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordCustomerPaymentRequest) => customersApi.recordPayment(customerId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customers', customerId] });
      qc.invalidateQueries({ queryKey: ['customers', customerId, 'ledger'] });
      toast.success('Payment recorded');
    },
    onError: () => toast.error('Failed to record payment'),
  });
}
