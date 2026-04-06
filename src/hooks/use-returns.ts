import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { returnsApi, type ReturnListParams, type CreateReturnRequest } from '@/api/returns.api';
import { toast } from 'sonner';

export function useReturns(params?: ReturnListParams) {
  return useQuery({
    queryKey: ['returns', params],
    queryFn: () => returnsApi.list(params),
  });
}

export function useReturn(id: string) {
  return useQuery({
    queryKey: ['returns', id],
    queryFn: () => returnsApi.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReturnRequest) => returnsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['returns'] });
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['credit'] });
      toast.success('Return processed');
    },
    onError: () => toast.error('Failed to process return'),
  });
}
