import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { BarcodeInput, ConfirmSheet, NumberStepper } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { useStockAdjust } from '@/hooks/use-inventory';
import { productsApi } from '@/api/products.api';
import { cn } from '@/lib/cn';
import type { AdjustmentReason } from '@/types/enums';

// ── Variant info from search / query params ──

interface VariantInfo {
  variantId: string;
  productId: string;
  productName: string;
  variantDescription: string;
  sku: string;
  currentStock: number;
}

const REASON_OPTIONS: { value: AdjustmentReason; label: string }[] = [
  { value: 'damage', label: 'Damage' },
  { value: 'theft', label: 'Theft' },
  { value: 'count_correction', label: 'Count Correction' },
  { value: 'expired', label: 'Expired' },
  { value: 'other', label: 'Other' },
];

// ── Main page ──

export default function StockAdjustmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const adjustMutation = useStockAdjust();

  // Variant state
  const [variant, setVariant] = useState<VariantInfo | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Form state
  const [mode, setMode] = useState<'remove' | 'add'>('remove');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<AdjustmentReason | ''>('');
  const [notes, setNotes] = useState('');

  // Confirm sheet
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Success state
  const [adjusted, setAdjusted] = useState(false);

  // ── Pre-populate from query params ──

  useEffect(() => {
    const variantId = searchParams.get('variantId');
    const productName = searchParams.get('productName');
    const sku = searchParams.get('sku');
    const currentStock = searchParams.get('currentStock');
    const productId = searchParams.get('productId');
    const variantDescription = searchParams.get('variantDescription');

    if (variantId && productName) {
      setVariant({
        variantId,
        productId: productId ?? '',
        productName,
        variantDescription: variantDescription ?? '',
        sku: sku ?? '',
        currentStock: currentStock ? parseInt(currentStock, 10) : 0,
      });
    }
  }, [searchParams]);

  // ── Barcode lookup ──

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    setLookupLoading(true);
    setLookupError(null);
    setVariant(null);

    try {
      const res = await productsApi.list({ search: barcode, limit: 1 });

      if (res.data.length === 0) {
        setLookupError(`No product found for "${barcode}"`);
        return;
      }

      const product = res.data[0];

      // Fetch full product detail to get variants
      const detail = await productsApi.get(product.id);
      const variants = detail.data.variants;

      if (!variants || variants.length === 0) {
        setLookupError('Product has no variants');
        return;
      }

      // Find matching variant by barcode or SKU, fallback to first
      const matched =
        variants.find(
          (v) => v.barcode === barcode || v.sku === barcode,
        ) ?? variants[0];

      // Build variant description from attributes
      const desc = matched.attributes
        ? Object.values(matched.attributes).join(' / ')
        : '';

      setVariant({
        variantId: matched.id,
        productId: product.id,
        productName: product.name,
        variantDescription: desc,
        sku: matched.sku,
        currentStock: matched.availableQuantity,
      });
    } catch {
      setLookupError('Failed to look up product. Please try again.');
    } finally {
      setLookupLoading(false);
    }
  }, []);

  // ── Submit ──

  const effectiveQty = mode === 'remove' ? -quantity : quantity;

  const handleConfirm = () => {
    if (!variant || !reason) return;

    adjustMutation.mutate(
      {
        variantId: variant.variantId,
        quantity: effectiveQty,
        reason: reason as AdjustmentReason,
        notes,
      },
      {
        onSuccess: () => {
          setAdjusted(true);
        },
      },
    );
  };

  const handleAdjustAnother = () => {
    setVariant(null);
    setMode('remove');
    setQuantity(1);
    setReason('');
    setNotes('');
    setAdjusted(false);
    setLookupError(null);
  };

  const isFormValid = variant && reason && quantity > 0 && notes.trim().length > 0;

  // ── Success view ──

  if (adjusted && variant) {
    return (
      <div>
        <PageHeader title="Stock Adjusted" showBack />
        <div className="flex flex-col items-center px-4 py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-success-50">
            <Package className="size-8 text-success-700" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            Adjustment Complete
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {variant.productName} {variant.variantDescription && `(${variant.variantDescription})`} adjusted by{' '}
            <span className={cn('font-semibold', effectiveQty > 0 ? 'text-success-700' : 'text-error-700')}>
              {effectiveQty > 0 ? '+' : ''}{effectiveQty}
            </span>
          </p>
          <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
            <Button onClick={handleAdjustAnother}>Adjust Another</Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main view ──

  return (
    <div>
      <PageHeader title="Stock Adjustment" showBack />

      <div className="flex flex-col gap-6 px-4 pb-8 desktop:px-6">
        {/* Barcode scanner */}
        {!variant && (
          <section>
            <Label className="mb-2 block text-sm font-medium">
              Scan or search product
            </Label>
            <BarcodeInput
              onSubmit={handleBarcodeScan}
              placeholder="Scan barcode or enter SKU"
            />

            {lookupLoading && (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            )}

            {lookupError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-warning-50 px-4 py-3 text-sm text-warning-700">
                <AlertTriangle className="size-4 shrink-0" />
                {lookupError}
              </div>
            )}
          </section>
        )}

        {/* Variant info card */}
        {variant && (
          <>
            <Card>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">
                      {variant.productName}
                    </p>
                    {variant.variantDescription && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {variant.variantDescription}
                      </p>
                    )}
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      SKU: {variant.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold tabular-nums text-foreground">
                      {variant.currentStock}
                    </p>
                    <p className="text-xs text-muted-foreground">Current Stock</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change variant button */}
            <Button
              variant="ghost"
              size="sm"
              className="-mt-3 self-start text-muted-foreground"
              onClick={() => {
                setVariant(null);
                setLookupError(null);
              }}
            >
              Change product
            </Button>

            {/* Mode toggle: Remove / Add */}
            <section>
              <Label className="mb-2 block text-sm font-medium">
                Adjustment Type
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('remove')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                    mode === 'remove'
                      ? 'border-error-200 bg-error-50 text-error-700'
                      : 'border-input bg-background text-foreground hover:bg-neutral-50',
                  )}
                >
                  <ArrowDown className="size-4" />
                  Remove Stock
                </button>
                <button
                  type="button"
                  onClick={() => setMode('add')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                    mode === 'add'
                      ? 'border-success-200 bg-success-50 text-success-700'
                      : 'border-input bg-background text-foreground hover:bg-neutral-50',
                  )}
                >
                  <ArrowUp className="size-4" />
                  Add Stock
                </button>
              </div>
            </section>

            {/* Quantity */}
            <section>
              <Label className="mb-2 block text-sm font-medium">
                Quantity
              </Label>
              <NumberStepper
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={999}
              />
              <p className="mt-2 text-sm text-muted-foreground">
                New stock will be:{' '}
                <span className="font-semibold tabular-nums text-foreground">
                  {variant.currentStock + effectiveQty}
                </span>
              </p>
            </section>

            {/* Reason */}
            <section>
              <Label className="mb-2 block text-sm font-medium">
                Reason
              </Label>
              <Select
                value={reason}
                onValueChange={(v) => setReason(v as AdjustmentReason)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>

            {/* Notes */}
            <section>
              <Label className="mb-2 block text-sm font-medium">
                Notes <span className="text-error-500">*</span>
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe why this adjustment is needed..."
                rows={3}
              />
            </section>

            {/* Submit */}
            <Button
              className="w-full"
              disabled={!isFormValid || adjustMutation.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              {adjustMutation.isPending ? 'Adjusting...' : 'Adjust Stock'}
            </Button>
          </>
        )}
      </div>

      {/* Confirm sheet */}
      {variant && (
        <ConfirmSheet
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Confirm Stock Adjustment"
          description={`Adjust stock for ${variant.productName}${variant.variantDescription ? ` (${variant.variantDescription})` : ''} by ${effectiveQty > 0 ? '+' : ''}${effectiveQty}? Reason: ${REASON_OPTIONS.find((r) => r.value === reason)?.label ?? reason}`}
          confirmLabel="Confirm Adjustment"
          onConfirm={handleConfirm}
          variant={mode === 'remove' ? 'destructive' : 'default'}
        />
      )}
    </div>
  );
}
