import { useMutation, useQueryClient } from '@tanstack/react-query';
import { migrationApi } from '@/api/migration.api';
import { toast } from 'sonner';

export function useImportCustomerKhata() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => migrationApi.importCustomers(formData),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['credit'] });
      const { imported, skipped } = res.data;
      toast.success(`Imported ${imported} customers. ${skipped} skipped.`);
    },
    onError: () => toast.error('Customer import failed'),
  });
}

export function useImportSupplierBalances() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => migrationApi.importSuppliers(formData),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      qc.invalidateQueries({ queryKey: ['credit'] });
      const { imported, skipped } = res.data;
      toast.success(`Imported ${imported} suppliers. ${skipped} skipped.`);
    },
    onError: () => toast.error('Supplier import failed'),
  });
}
