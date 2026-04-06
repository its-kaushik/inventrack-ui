import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout';
import { EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useBulkImport } from '@/hooks/use-products';
import { productsApi } from '@/api/products.api';
import { cn } from '@/lib/cn';

// ── Types ──

type PageState = 'upload' | 'preview' | 'importing' | 'result';

interface RowValidation {
  row: Record<string, string>;
  index: number;
  valid: boolean;
  error?: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

// ── Constants ──

const TEMPLATE_COLUMNS = [
  'product_name',
  'brand',
  'category',
  'hsn_code',
  'has_variants',
  'color',
  'size',
  'fabric',
  'pattern',
  'fit',
  'cost_price',
  'mrp',
  'initial_qty',
];

const REQUIRED_FIELDS = ['product_name', 'brand', 'category', 'cost_price', 'mrp'];

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx'];

const PREVIEW_ROW_LIMIT = 20;

// ── Validation ──

function validateRow(
  row: Record<string, string>,
  index: number,
): { valid: boolean; error?: string } {
  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    const value = row[field]?.trim();
    if (!value) {
      return { valid: false, error: `Row ${index + 1}: Missing required field "${field}"` };
    }
  }

  // Validate cost_price is a positive number
  const costPrice = Number(row.cost_price);
  if (isNaN(costPrice) || costPrice <= 0) {
    return { valid: false, error: `Row ${index + 1}: cost_price must be a positive number` };
  }

  // Validate mrp is a positive number
  const mrp = Number(row.mrp);
  if (isNaN(mrp) || mrp <= 0) {
    return { valid: false, error: `Row ${index + 1}: mrp must be a positive number` };
  }

  // Validate mrp >= cost_price
  if (mrp < costPrice) {
    return { valid: false, error: `Row ${index + 1}: mrp must be >= cost_price` };
  }

  return { valid: true };
}

// ── Component ──

export default function BulkImportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkImport = useBulkImport();

  // ── State ──
  const [pageState, setPageState] = useState<PageState>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<RowValidation[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // ── Derived values ──
  const validRows = parsedRows.filter((r) => r.valid);
  const errorRows = parsedRows.filter((r) => !r.valid);

  // ── Template download ──
  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      const blob = await productsApi.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Template downloaded');
    } catch {
      toast.error('Failed to download template');
    } finally {
      setIsDownloading(false);
    }
  };

  // ── File parsing ──
  const parseFile = useCallback((selectedFile: File) => {
    setFile(selectedFile);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[];

        if (data.length === 0) {
          toast.error('CSV file is empty');
          return;
        }

        const validated: RowValidation[] = data.map((row, index) => ({
          row,
          index,
          ...validateRow(row, index),
        }));

        setParsedRows(validated);
        setPageState('preview');
      },
      error: () => {
        toast.error('Failed to parse CSV file');
      },
    });
  }, []);

  // ── File selection ──
  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      const name = selectedFile.name.toLowerCase();
      const isValid = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));

      if (!isValid) {
        toast.error('Please select a .csv or .xlsx file');
        return;
      }

      parseFile(selectedFile);
    },
    [parseFile],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  // ── Drag and drop ──
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect],
  );

  // ── Import ──
  const handleImport = async () => {
    if (!file || validRows.length === 0) return;

    setPageState('importing');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await bulkImport.mutateAsync(formData);
      setImportResult(response.data);
      setPageState('result');
    } catch {
      setPageState('preview');
    }
  };

  // ── Reset ──
  const handleReset = () => {
    setPageState('upload');
    setFile(null);
    setParsedRows([]);
    setImportResult(null);
  };

  // ── Render states ──

  const renderUploadState = () => (
    <div className="flex flex-col gap-6">
      {/* Download template */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Download Template</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Download the CSV template with the correct column headers. Fill in
            your product data and upload it below.
          </p>
          <p className="mb-4 text-xs text-muted-foreground">
            Columns: {TEMPLATE_COLUMNS.join(', ')}
          </p>
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
            ) : (
              <Download className="size-4" data-icon="inline-start" />
            )}
            Download Template
          </Button>
        </CardContent>
      </Card>

      {/* Upload zone */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Upload CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50',
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mb-3 size-10 text-muted-foreground/50" />
            <p className="mb-1 text-sm font-medium text-foreground">
              Drag and drop your CSV file here
            </p>
            <p className="mb-4 text-xs text-muted-foreground">
              Accepts .csv and .xlsx files
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="size-4" data-icon="inline-start" />
              Choose File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPreviewState = () => (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Preview Import</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm">
              <FileSpreadsheet className="size-4 text-muted-foreground" />
              <span className="font-medium">{file?.name}</span>
              <span className="text-muted-foreground">
                ({parsedRows.length} {parsedRows.length === 1 ? 'row' : 'rows'})
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle className="size-4 text-success-500" />
                <span className="text-success-700">
                  {validRows.length} valid {validRows.length === 1 ? 'row' : 'rows'}
                </span>
              </div>
              {errorRows.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <XCircle className="size-4 text-error-500" />
                  <span className="text-error-700">
                    {errorRows.length} {errorRows.length === 1 ? 'row' : 'rows'} with errors
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Row Preview{' '}
            {parsedRows.length > PREVIEW_ROW_LIMIT && (
              <span className="text-sm font-normal text-muted-foreground">
                (showing first {PREVIEW_ROW_LIMIT} of {parsedRows.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">MRP</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedRows.slice(0, PREVIEW_ROW_LIMIT).map((item) => (
                  <TableRow key={item.index}>
                    <TableCell className="text-muted-foreground">
                      {item.index + 1}
                    </TableCell>
                    <TableCell>
                      {item.valid ? (
                        <CheckCircle className="size-4 text-success-500" />
                      ) : (
                        <XCircle className="size-4 text-error-500" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.row.product_name || '\u2014'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.row.brand || '\u2014'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.row.category || '\u2014'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.row.cost_price || '\u2014'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.row.mrp || '\u2014'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-error-700">
                      {item.error ?? ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={handleReset}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          disabled={validRows.length === 0}
        >
          <Upload className="size-4" data-icon="inline-start" />
          Import {validRows.length} {validRows.length === 1 ? 'Product' : 'Products'}
        </Button>
      </div>
    </div>
  );

  const renderImportingState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="mb-4 size-10 animate-spin text-primary" />
      <p className="text-lg font-medium text-foreground">
        Importing {validRows.length} {validRows.length === 1 ? 'product' : 'products'}...
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Please do not close this page.
      </p>
    </div>
  );

  const renderResultState = () => {
    if (!importResult) return null;

    const hasErrors = importResult.errors.length > 0;

    return (
      <div className="flex flex-col gap-6">
        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Import Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="size-5 text-success-500" />
                <span className="text-lg font-semibold text-foreground">
                  Imported {importResult.imported} {importResult.imported === 1 ? 'product' : 'products'}.
                </span>
              </div>

              {importResult.skipped > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="size-4 text-warning-500" />
                  <span className="text-warning-700">
                    {importResult.skipped} skipped.
                  </span>
                </div>
              )}

              {hasErrors && (
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="size-4 text-error-500" />
                  <span className="text-error-700">
                    {importResult.errors.length} {importResult.errors.length === 1 ? 'error' : 'errors'}.
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error details */}
        {hasErrors && (
          <Card>
            <CardHeader>
              <CardTitle>Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg ring-1 ring-foreground/10">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Row</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResult.errors.map((err, i) => (
                      <TableRow key={i}>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {err.row}
                        </TableCell>
                        <TableCell className="text-sm text-error-700">
                          {err.message}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleReset}>
            Import More
          </Button>
          <Button onClick={() => navigate('/products')}>
            View Products
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader
        title="Bulk Import Products"
        showBack
        onBack={() => navigate('/products')}
      />

      <div className="flex-1 px-4 pb-6 desktop:px-6">
        {pageState === 'upload' && renderUploadState()}
        {pageState === 'preview' && renderPreviewState()}
        {pageState === 'importing' && renderImportingState()}
        {pageState === 'result' && renderResultState()}
      </div>
    </div>
  );
}
