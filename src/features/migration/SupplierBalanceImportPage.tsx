import { useNavigate } from 'react-router-dom';
import { MigrationImportFlow } from './MigrationImportFlow';
import { useImportSupplierBalances } from '@/hooks/use-migration';
import { migrationApi } from '@/api/migration.api';
import type { MigrationResult } from '@/api/migration.api';

const REQUIRED_COLUMNS = ['name', 'phone', 'outstanding_balance'];
const PREVIEW_COLUMNS = ['name', 'phone', 'outstanding_balance', 'gstin', 'payment_terms'];

function validateRow(row: Record<string, string>, index: number) {
  if (!row.name?.trim()) return { valid: false, error: 'Name is required' };
  const balance = parseFloat(row.outstanding_balance);
  if (isNaN(balance) || balance < 0) return { valid: false, error: 'Outstanding balance must be a non-negative number' };
  if (row.gstin?.trim() && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(row.gstin.trim())) {
    return { valid: false, error: 'Invalid GSTIN format' };
  }
  return { valid: true };
}

export default function SupplierBalanceImportPage() {
  const navigate = useNavigate();
  const importMutation = useImportSupplierBalances();

  return (
    <MigrationImportFlow
      title="Import Supplier Balances"
      description="Import existing supplier outstanding balances from your paper records. Each row creates a supplier with an opening balance entry."
      templateType="suppliers"
      requiredColumns={REQUIRED_COLUMNS}
      validateRow={validateRow}
      previewColumns={PREVIEW_COLUMNS}
      onDownloadTemplate={() => migrationApi.downloadTemplate('suppliers')}
      onImport={(formData) => importMutation.mutateAsync(formData).then((r) => r.data)}
      importPending={importMutation.isPending}
      resultData={importMutation.data?.data as MigrationResult | undefined ?? null}
      onNavigateBack={() => navigate('/settings')}
      onNavigateToList={() => navigate('/suppliers')}
      listLabel="View Suppliers"
    />
  );
}
