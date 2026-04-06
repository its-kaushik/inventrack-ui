import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { Download, Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout';
import { StatusBadge, EmptyState } from '@/components/shared';
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

import { cn } from '@/lib/cn';

// ── Types ──

interface ParsedRow {
  index: number;
  data: Record<string, string>;
  valid: boolean;
  error?: string;
}

interface MigrationImportFlowProps {
  title: string;
  description: string;
  templateType: 'customers' | 'suppliers';
  requiredColumns: string[];
  validateRow: (row: Record<string, string>, index: number) => { valid: boolean; error?: string };
  previewColumns: string[];
  onDownloadTemplate: () => Promise<Blob>;
  onImport: (formData: FormData) => Promise<unknown>;
  importPending: boolean;
  resultData?: { imported: number; skipped: number; errors: { row: number; message: string }[] } | null;
  onNavigateBack: () => void;
  onNavigateToList: () => void;
  listLabel: string;
}

type FlowState = 'upload' | 'preview' | 'importing' | 'result';

export function MigrationImportFlow({
  title,
  description,
  templateType,
  requiredColumns,
  validateRow,
  previewColumns,
  onDownloadTemplate,
  onImport,
  importPending,
  resultData,
  onNavigateBack,
  onNavigateToList,
  listLabel,
}: MigrationImportFlowProps) {
  const [state, setState] = useState<FlowState>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [dragging, setDragging] = useState(false);

  const validCount = parsedRows.filter((r) => r.valid).length;
  const errorCount = parsedRows.filter((r) => !r.valid).length;

  // ── Template download ──
  const handleDownloadTemplate = useCallback(async () => {
    try {
      const blob = await onDownloadTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateType}-import-template.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Template downloaded');
    } catch {
      toast.error('Failed to download template');
    }
  }, [onDownloadTemplate, templateType]);

  // ── File parsing ──
  const parseFile = useCallback(
    (f: File) => {
      setFile(f);
      Papa.parse(f, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows: ParsedRow[] = results.data.map((row: any, i: number) => {
            const validation = validateRow(row, i + 1);
            return { index: i + 1, data: row, ...validation };
          });
          setParsedRows(rows);
          setState('preview');
        },
        error: () => {
          toast.error('Failed to parse CSV file');
        },
      });
    },
    [validateRow],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) parseFile(f);
    },
    [parseFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f && (f.name.endsWith('.csv') || f.name.endsWith('.xlsx'))) {
        parseFile(f);
      } else {
        toast.error('Please upload a .csv file');
      }
    },
    [parseFile],
  );

  // ── Import ──
  const handleImport = useCallback(async () => {
    if (!file || validCount === 0) return;
    setState('importing');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await onImport(formData);
      setState('result');
    } catch {
      setState('preview');
    }
  }, [file, validCount, onImport]);

  // ── Reset ──
  const handleReset = () => {
    setState('upload');
    setFile(null);
    setParsedRows([]);
  };

  return (
    <div className="space-y-4 p-4 desktop:p-6">
      <PageHeader title={title} showBack onBack={onNavigateBack} />

      <p className="text-sm text-neutral-500">{description}</p>

      {/* ── State: Upload ── */}
      {state === 'upload' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Step 1: Download Template</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-neutral-500">
                Download the CSV template with the correct column headers, fill it with your data, and upload.
              </p>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="size-4" data-icon="inline-start" />
                Download Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Step 2: Upload File</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                  dragging ? 'border-primary-500 bg-primary-50' : 'border-neutral-300',
                )}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <Upload className="size-8 text-neutral-400" />
                <p className="text-sm text-neutral-600">
                  Drag & drop your CSV file here, or
                </p>
                <Button variant="outline" onClick={() => document.getElementById('migration-file-input')?.click()}>
                  Choose File
                </Button>
                <input
                  id="migration-file-input"
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <p className="mt-2 text-center text-xs text-neutral-400">
                Required columns: {requiredColumns.join(', ')}
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── State: Preview ── */}
      {state === 'preview' && (
        <>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-800">
                    <FileSpreadsheet className="mr-1 inline size-4" />
                    {file?.name}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">{parsedRows.length} rows found</p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status="green" label={`${validCount} valid`} />
                  {errorCount > 0 && <StatusBadge status="red" label={`${errorCount} errors`} />}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="overflow-x-auto rounded-card border border-neutral-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-12">Status</TableHead>
                  {previewColumns.map((col) => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedRows.slice(0, 30).map((row) => (
                  <TableRow key={row.index} className={cn(!row.valid && 'bg-error-50')}>
                    <TableCell className="text-xs text-neutral-400">{row.index}</TableCell>
                    <TableCell>
                      {row.valid ? (
                        <CheckCircle className="size-4 text-success-500" />
                      ) : (
                        <XCircle className="size-4 text-error-500" />
                      )}
                    </TableCell>
                    {previewColumns.map((col) => (
                      <TableCell key={col} className="text-sm">{row.data[col] ?? '—'}</TableCell>
                    ))}
                    <TableCell className="text-xs text-error-600">{row.error ?? ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset}>Cancel</Button>
            <Button onClick={handleImport} disabled={validCount === 0}>
              Import {validCount} Records
            </Button>
          </div>
        </>
      )}

      {/* ── State: Importing ── */}
      {state === 'importing' && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="size-8 animate-spin text-primary-600" />
            <p className="text-sm text-neutral-600">Importing {validCount} records...</p>
          </CardContent>
        </Card>
      )}

      {/* ── State: Result ── */}
      {state === 'result' && resultData && (
        <>
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-8">
              <CheckCircle className="size-12 text-success-500" />
              <h3 className="text-lg font-semibold text-neutral-800">Import Complete</h3>
              <p className="text-sm text-neutral-600">
                {resultData.imported} imported · {resultData.skipped} skipped
              </p>
            </CardContent>
          </Card>

          {resultData.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-error-600">
                  Errors ({resultData.errors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-y-auto">
                  {resultData.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 border-b border-neutral-100 py-2 last:border-0">
                      <span className="shrink-0 text-xs font-mono text-neutral-400">Row {err.row}</span>
                      <span className="text-sm text-error-600">{err.message}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset}>Import More</Button>
            <Button onClick={onNavigateToList}>{listLabel}</Button>
          </div>
        </>
      )}
    </div>
  );
}
