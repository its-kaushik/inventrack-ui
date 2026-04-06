import { useNavigate } from 'react-router-dom';
import { MigrationImportFlow } from './MigrationImportFlow';
import { useImportCustomerKhata } from '@/hooks/use-migration';
import { migrationApi } from '@/api/migration.api';
import type { MigrationResult } from '@/api/migration.api';

const REQUIRED_COLUMNS = ['name', 'phone', 'outstanding_balance'];
const PREVIEW_COLUMNS = ['name', 'phone', 'outstanding_balance', 'email', 'address'];

function validateRow(row: Record<string, string>, index: number) {
  if (!row.name?.trim()) return { valid: false, error: 'Name is required' };
  if (!row.phone?.trim()) return { valid: false, error: 'Phone is required' };
  if (!/^\d{10}$/.test(row.phone.trim())) return { valid: false, error: 'Phone must be 10 digits' };
  const balance = parseFloat(row.outstanding_balance);
  if (isNaN(balance) || balance < 0) return { valid: false, error: 'Outstanding balance must be a non-negative number' };
  return { valid: true };
}

export default function CustomerKhataImportPage() {
  const navigate = useNavigate();
  const importMutation = useImportCustomerKhata();

  return (
    <MigrationImportFlow
      title="Import Customer Khata"
      description="Import existing customer credit balances from your paper notebook. Each row creates a customer with an opening balance entry."
      templateType="customers"
      requiredColumns={REQUIRED_COLUMNS}
      validateRow={validateRow}
      previewColumns={PREVIEW_COLUMNS}
      onDownloadTemplate={() => migrationApi.downloadTemplate('customers')}
      onImport={(formData) => importMutation.mutateAsync(formData).then((r) => r.data)}
      importPending={importMutation.isPending}
      resultData={importMutation.data?.data as MigrationResult | undefined ?? null}
      onNavigateBack={() => navigate('/settings')}
      onNavigateToList={() => navigate('/customers')}
      listLabel="View Customers"
    />
  );
}
