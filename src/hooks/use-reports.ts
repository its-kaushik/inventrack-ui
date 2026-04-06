import { useQuery, useMutation } from '@tanstack/react-query';
import { reportsApi, type ReportParams } from '@/api/reports.api';
import { toast } from 'sonner';

/** Generic report data hook — takes a report key and params. */
export function useReport(reportKey: string, fetcher: (p?: ReportParams) => Promise<{ data: unknown }>, params?: ReportParams) {
  return useQuery({
    queryKey: ['reports', reportKey, params],
    queryFn: () => fetcher(params).then((r) => r.data),
    enabled: !!reportKey,
  });
}

/** Download a CSV export as a blob. */
export function useExportCSV() {
  return useMutation({
    mutationFn: async ({ fetcher, fileName }: { fetcher: (p?: ReportParams) => Promise<Blob>; fileName: string; params?: ReportParams }) => {
      const blob = await fetcher();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success('Export downloaded'),
    onError: () => toast.error('Export failed'),
  });
}

// ── Convenience hooks for each report ──

export const useReportFetchers = () => reportsApi;
