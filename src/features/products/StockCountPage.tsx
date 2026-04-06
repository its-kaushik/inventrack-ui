import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  ScanLine,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout';
import { BarcodeInput, NumberStepper, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useStockCount } from '@/hooks/use-inventory';
import { productsApi } from '@/api/products.api';
import { cn } from '@/lib/cn';
import type { StockCountResult, StockCountVarianceItem } from '@/api/inventory.api';

// ── Local count item ──

interface CountItem {
  variantId: string;
  productName: string;
  variantDescription: string;
  sku: string;
  expected: number;
  actual: number;
}

// ── Scanned variant info ──

interface ScannedVariant {
  variantId: string;
  productName: string;
  variantDescription: string;
  sku: string;
  currentStock: number;
}

// ── Main page ──

export default function StockCountPage() {
  const navigate = useNavigate();
  const stockCountMutation = useStockCount();

  // Phase: counting or results
  const [phase, setPhase] = useState<'counting' | 'results'>('counting');

  // Counting phase state
  const [countItems, setCountItems] = useState<CountItem[]>([]);
  const [scannedVariant, setScannedVariant] = useState<ScannedVariant | null>(null);
  const [actualCount, setActualCount] = useState(0);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [countNotes, setCountNotes] = useState('');

  // Results phase state
  const [result, setResult] = useState<StockCountResult | null>(null);

  // ── Barcode lookup ──

  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      setLookupLoading(true);
      setLookupError(null);
      setScannedVariant(null);

      try {
        const res = await productsApi.list({ search: barcode, limit: 1 });

        if (res.data.length === 0) {
          setLookupError(`No product found for "${barcode}"`);
          return;
        }

        const product = res.data[0];

        // Fetch full detail to get variants
        const detail = await productsApi.get(product.id);
        const variants = detail.data.variants;

        if (!variants || variants.length === 0) {
          setLookupError('Product has no variants');
          return;
        }

        // Match by barcode or SKU, fallback to first
        const matched =
          variants.find((v) => v.barcode === barcode || v.sku === barcode) ??
          variants[0];

        // Check if already counted
        const alreadyCounted = countItems.find(
          (ci) => ci.variantId === matched.id,
        );
        if (alreadyCounted) {
          setLookupError(
            `${product.name} (${matched.sku}) has already been counted. Remove it first to recount.`,
          );
          return;
        }

        const desc = matched.attributes
          ? Object.values(matched.attributes).join(' / ')
          : '';

        setScannedVariant({
          variantId: matched.id,
          productName: product.name,
          variantDescription: desc,
          sku: matched.sku,
          currentStock: matched.availableQuantity,
        });
        setActualCount(matched.availableQuantity); // Default to expected
      } catch {
        setLookupError('Failed to look up product. Please try again.');
      } finally {
        setLookupLoading(false);
      }
    },
    [countItems],
  );

  // ── Add to count list ──

  const handleAddToCount = () => {
    if (!scannedVariant) return;

    setCountItems((prev) => [
      ...prev,
      {
        variantId: scannedVariant.variantId,
        productName: scannedVariant.productName,
        variantDescription: scannedVariant.variantDescription,
        sku: scannedVariant.sku,
        expected: scannedVariant.currentStock,
        actual: actualCount,
      },
    ]);

    // Reset for next scan
    setScannedVariant(null);
    setActualCount(0);
    setLookupError(null);
  };

  // ── Remove from count list ──

  const handleRemoveItem = (variantId: string) => {
    setCountItems((prev) => prev.filter((ci) => ci.variantId !== variantId));
  };

  // ── Submit stock count ──

  const handleCompleteCount = () => {
    if (countItems.length === 0) {
      toast.error('Add at least one item to the count');
      return;
    }

    stockCountMutation.mutate(
      {
        items: countItems.map((ci) => ({
          variantId: ci.variantId,
          expectedQuantity: ci.expected,
          actualQuantity: ci.actual,
        })),
        notes: countNotes.trim() || undefined,
      },
      {
        onSuccess: (res) => {
          setResult(res.data);
          setPhase('results');
        },
      },
    );
  };

  // ── Cancel scanned variant ──

  const handleCancelScan = () => {
    setScannedVariant(null);
    setActualCount(0);
    setLookupError(null);
  };

  // ── Results phase ──

  if (phase === 'results' && result) {
    return (
      <div>
        <PageHeader title="Stock Count Results" />

        <div className="flex flex-col gap-6 px-4 pb-8 desktop:px-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card size="sm">
              <CardContent>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {result.totalCounted}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Total Counted
                </p>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent>
                <p className="text-2xl font-bold tabular-nums text-success-700">
                  {result.matched}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Matched</p>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent>
                <p className="text-2xl font-bold tabular-nums text-warning-700">
                  {result.discrepancies}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Discrepancies
                </p>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {result.adjustmentsCreated}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Adjustments
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Variance table — desktop */}
          {result.items.length > 0 && (
            <div className="hidden overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10 desktop:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.items.map((item) => (
                    <VarianceRow key={item.variantId} item={item} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Variance cards — mobile */}
          {result.items.length > 0 && (
            <div className="flex flex-col gap-2 desktop:hidden">
              {result.items.map((item) => (
                <VarianceCard key={item.variantId} item={item} />
              ))}
            </div>
          )}

          {/* Done button */}
          <Button className="w-full" onClick={() => navigate('/products')}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  // ── Counting phase ──

  return (
    <div>
      <PageHeader title="Stock Count" showBack />

      <div className="flex flex-col gap-5 px-4 pb-8 desktop:px-6">
        {/* Barcode scanner */}
        <section>
          <Label className="mb-2 block text-sm font-medium">
            Scan item barcode
          </Label>
          <BarcodeInput
            onSubmit={handleBarcodeScan}
            placeholder="Scan barcode or enter SKU"
          />
        </section>

        {/* Lookup loading */}
        {lookupLoading && (
          <div className="space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        )}

        {/* Lookup error */}
        {lookupError && (
          <div className="flex items-center gap-2 rounded-lg bg-warning-50 px-4 py-3 text-sm text-warning-700">
            <AlertTriangle className="size-4 shrink-0" />
            {lookupError}
          </div>
        )}

        {/* Scanned variant — enter actual count */}
        {scannedVariant && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="size-4 text-primary-600" />
                Scanned Item
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <p className="font-semibold text-foreground">
                  {scannedVariant.productName}
                </p>
                {scannedVariant.variantDescription && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {scannedVariant.variantDescription}
                  </p>
                )}
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  SKU: {scannedVariant.sku}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Expected (system):{' '}
                  <span className="font-semibold tabular-nums text-foreground">
                    {scannedVariant.currentStock}
                  </span>
                </p>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium">
                  Actual Count
                </Label>
                <NumberStepper
                  value={actualCount}
                  onChange={setActualCount}
                  min={0}
                  max={9999}
                />
              </div>

              {actualCount !== scannedVariant.currentStock && (
                <div className="flex items-center gap-2 rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-700">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  Variance: {actualCount - scannedVariant.currentStock > 0 ? '+' : ''}
                  {actualCount - scannedVariant.currentStock}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancelScan}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleAddToCount}>
                  Add to Count
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Counted items list */}
        {countItems.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Counted Items ({countItems.length})
              </h2>
            </div>

            <div className="flex flex-col gap-2">
              {countItems.map((item) => {
                const variance = item.actual - item.expected;
                const hasVariance = variance !== 0;

                return (
                  <div
                    key={item.variantId}
                    className="flex items-center gap-3 rounded-lg border border-input p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.productName}
                      </p>
                      {item.variantDescription && (
                        <p className="truncate text-xs text-muted-foreground">
                          {item.variantDescription}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Exp: {item.expected}</span>
                        <span>Act: {item.actual}</span>
                        {hasVariance && (
                          <span
                            className={cn(
                              'font-semibold',
                              variance > 0 ? 'text-success-700' : 'text-error-700',
                            )}
                          >
                            {variance > 0 ? '+' : ''}
                            {variance}
                          </span>
                        )}
                        {!hasVariance && (
                          <CheckCircle className="size-3.5 text-success-500" />
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded p-1 text-muted-foreground hover:bg-neutral-100 hover:text-error-600"
                      onClick={() => handleRemoveItem(item.variantId)}
                      aria-label={`Remove ${item.productName}`}
                    >
                      <XCircle className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty state when no items counted yet and no scan active */}
        {countItems.length === 0 && !scannedVariant && !lookupLoading && (
          <EmptyState
            icon={ScanLine}
            title="Start counting"
            description="Scan a product barcode to begin the stock count. Count each item's physical stock and compare against the system."
          />
        )}

        {/* Notes */}
        {countItems.length > 0 && (
          <section>
            <Label className="mb-2 block text-sm font-medium">
              Count Notes (optional)
            </Label>
            <Textarea
              value={countNotes}
              onChange={(e) => setCountNotes(e.target.value)}
              placeholder="Any notes about this stock count..."
              rows={2}
            />
          </section>
        )}

        {/* Complete count button */}
        {countItems.length > 0 && (
          <Button
            className="w-full"
            disabled={stockCountMutation.isPending}
            onClick={handleCompleteCount}
          >
            {stockCountMutation.isPending
              ? 'Submitting...'
              : `Complete Count (${countItems.length} items)`}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Variance display components ──

function VarianceRow({ item }: { item: StockCountVarianceItem }) {
  const hasVariance = item.variance !== 0;

  return (
    <TableRow>
      <TableCell className="font-medium text-foreground">
        {item.productName}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {item.variantDescription}
        {item.sku && (
          <span className="ml-1 font-mono text-xs">({item.sku})</span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">{item.expected}</TableCell>
      <TableCell className="text-right tabular-nums">{item.actual}</TableCell>
      <TableCell className="text-right">
        <span
          className={cn(
            'font-semibold tabular-nums',
            !hasVariance
              ? 'text-muted-foreground'
              : item.variance > 0
                ? 'text-success-700'
                : 'text-error-700',
          )}
        >
          {hasVariance
            ? `${item.variance > 0 ? '+' : ''}${item.variance}`
            : '0'}
        </span>
      </TableCell>
      <TableCell>
        {hasVariance ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-warning-700">
            <AlertTriangle className="size-3" />
            Discrepancy
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-success-700">
            <CheckCircle className="size-3" />
            Match
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

function VarianceCard({ item }: { item: StockCountVarianceItem }) {
  const hasVariance = item.variance !== 0;

  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        hasVariance ? 'border-warning-200 bg-warning-50/50' : 'border-input',
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {item.productName}
          </p>
          {item.variantDescription && (
            <p className="truncate text-xs text-muted-foreground">
              {item.variantDescription}
            </p>
          )}
        </div>
        {hasVariance ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-warning-700">
            <AlertTriangle className="size-3" />
            Discrepancy
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-success-700">
            <CheckCircle className="size-3" />
            Match
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span>Expected: {item.expected}</span>
        <span>Actual: {item.actual}</span>
        <span
          className={cn(
            'font-semibold',
            !hasVariance
              ? 'text-muted-foreground'
              : item.variance > 0
                ? 'text-success-700'
                : 'text-error-700',
          )}
        >
          Variance: {item.variance > 0 ? '+' : ''}
          {item.variance}
        </span>
      </div>
    </div>
  );
}
