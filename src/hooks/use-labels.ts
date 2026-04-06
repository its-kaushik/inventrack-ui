import { useMutation, useQuery } from '@tanstack/react-query';
import { labelsApi, type GenerateLabelRequest } from '@/api/labels.api';
import { toast } from 'sonner';

export function useLabelTemplates() {
  return useQuery({
    queryKey: ['label-templates'],
    queryFn: () => labelsApi.listTemplates().then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });
}

export function useGenerateLabelPdf() {
  return useMutation({
    mutationFn: (data: GenerateLabelRequest) => labelsApi.generatePdf(data),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'labels.pdf';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Label PDF downloaded');
    },
    onError: () => toast.error('Failed to generate labels'),
  });
}
