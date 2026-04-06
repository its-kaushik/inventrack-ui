import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout';
import {
  BarcodeInput,
  NumberStepper,
  CurrencyInput,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

import {
  useCreatePurchaseOrder,
  useSendPurchaseOrder,
} from '@/hooks/use-purchase-orders';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useIsMobile } from '@/hooks/use-media-query';
import { productsApi } from '@/api/products.api';
import { formatINR } from '@/lib/currency';
import { cn } from '@/lib/cn';

// ── Types ──

interface POFormItem {
  variantId: string;
  productName: string;
  variantDescription: string;
  sku: string;
  quantity: number;
  costPrice: number;
}

// ── Main Page ──

export default function POFormPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // ── Mutations ──
  const createMutation = useCreatePurchaseOrder();
  const sendMutation = useSendPurchaseOrder();

  // ── Supplier list ──
  const { data: suppliersResponse } = useSuppliers({ limit: 200, isActive: 'true' });
  const suppliers = suppliersResponse?.data ?? [];

  // ── Form state ──
  const [supplierId, setSupplierId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<POFormItem[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // ── Validation errors ──
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Computed ──
  const runningTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.costPrice, 0),
    [items],
  );

  // ── Barcode scan handler ──
  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      if (isLookingUp) return;
      setIsLookingUp(true);

      try {
        // Search for product by barcode/name
        const searchResult = await productsApi.list({ search: barcode, limit: 1 });

        if (!searchResult.data.length) {
          toast.error(`No product found for "${barcode}"`);
          return;
        }

        const product = searchResult.data[0];
        // Fetch full product with variants
        const detail = await productsApi.get(product.id);
        const productDetail = detail.data;

        if (productDetail.variants.length === 0) {
          toast.error(`${productDetail.name} has no variants`);
          return;
        }

        // Try to match by barcode, otherwise use first variant
        let variant = productDetail.variants.find((v) => v.barcode === barcode);
        if (!variant) {
          variant = productDetail.variants[0];
        }

        // Check if already in list — if so, increment quantity
        setItems((prev) => {
          const existingIndex = prev.findIndex((it) => it.variantId === variant.id);
          if (existingIndex >= 0) {
            return prev.map((it, i) =>
              i === existingIndex ? { ...it, quantity: it.quantity + 1 } : it,
            );
          }
          return [
            ...prev,
            {
              variantId: variant.id,
              productName: productDetail.name,
              variantDescription: variant.attributes
                ? Object.values(variant.attributes).join(' / ')
                : '',
              sku: variant.sku,
              quantity: 1,
              costPrice: parseFloat(variant.costPrice) || 0,
            },
          ];
        });

        toast.success(`Added ${productDetail.name}`);
      } catch {
        toast.error('Failed to look up product');
      } finally {
        setIsLookingUp(false);
      }
    },
    [isLookingUp],
  );

  // ── Item handlers ──
  const updateItemQuantity = useCallback((index: number, quantity: number) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, quantity } : it)),
    );
  }, []);

  const updateItemCostPrice = useCallback((index: number, costPrice: number | '') => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, costPrice: costPrice === '' ? 0 : costPrice } : it,
      ),
    );
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Validation ──
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!supplierId) {
      newErrors.supplier = 'Please select a supplier';
    }
    if (items.length === 0) {
      newErrors.items = 'Add at least one item';
    }
    items.forEach((item, i) => {
      if (item.quantity <= 0) {
        newErrors[`item_qty_${i}`] = 'Quantity must be greater than 0';
      }
      if (item.costPrice <= 0) {
        newErrors[`item_cost_${i}`] = 'Cost must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit handlers ──
  const buildPayload = () => ({
    supplierId,
    expectedDeliveryDate: expectedDeliveryDate || null,
    notes: notes.trim() || null,
    items: items.map((it) => ({
      variantId: it.variantId,
      quantity: it.quantity,
      costPrice: it.costPrice,
    })),
  });

  const handleSaveDraft = async () => {
    if (!validate()) return;

    try {
      await createMutation.mutateAsync(buildPayload());
      navigate('/purchases');
    } catch {
      // Error handled by mutation hook
    }
  };

  const handleSaveAndSend = async () => {
    if (!validate()) return;

    try {
      const result = await createMutation.mutateAsync(buildPayload());
      const poId = result.data.id;
      await sendMutation.mutateAsync(poId);
      navigate('/purchases');
    } catch {
      // Error handled by mutation hooks
    }
  };

  const isPending = createMutation.isPending || sendMutation.isPending;

  return (
    <div>
      <PageHeader title="Create Purchase Order" showBack />

      <div className="flex flex-col gap-5 px-4 pb-8 desktop:max-w-3xl desktop:px-6">
        {/* Supplier selection */}
        <div className="space-y-1.5">
          <Label htmlFor="po-supplier">
            Supplier <span className="text-error-500">*</span>
          </Label>
          <Select value={supplierId} onValueChange={(val) => setSupplierId(val ?? '')}>
            <SelectTrigger className="w-full" id="po-supplier">
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.supplier && (
            <p className="text-xs text-error-500">{errors.supplier}</p>
          )}
        </div>

        {/* Expected delivery date */}
        <div className="space-y-1.5">
          <Label htmlFor="po-delivery-date">Expected Delivery Date</Label>
          <input
            id="po-delivery-date"
            type="date"
            value={expectedDeliveryDate}
            onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            className={cn(
              'h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground',
              'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
              'outline-none transition-colors',
            )}
          />
        </div>

        <Separator />

        {/* Add line items */}
        <div className="space-y-3">
          <Label>Add Items</Label>
          <BarcodeInput
            onSubmit={handleBarcodeScan}
            placeholder="Scan barcode or search product"
          />
          {isLookingUp && (
            <p className="text-xs text-muted-foreground">Looking up product...</p>
          )}
          {errors.items && items.length === 0 && (
            <p className="text-xs text-error-500">{errors.items}</p>
          )}
        </div>

        {/* Items list */}
        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Line Items ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile: card layout */}
              {isMobile ? (
                <div className="flex flex-col divide-y divide-border">
                  {items.map((item, index) => (
                    <div key={item.variantId} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">
                            {item.productName}
                          </p>
                          {item.variantDescription && (
                            <p className="truncate text-xs text-muted-foreground">
                              {item.variantDescription}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            SKU: {item.sku}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-error-500"
                          onClick={() => removeItem(index)}
                          aria-label={`Remove ${item.productName}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Qty</span>
                          <NumberStepper
                            value={item.quantity}
                            onChange={(val) => updateItemQuantity(index, val)}
                            min={1}
                            max={9999}
                          />
                          {errors[`item_qty_${index}`] && (
                            <p className="text-xs text-error-500">{errors[`item_qty_${index}`]}</p>
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <span className="text-xs text-muted-foreground">Cost Price</span>
                          <CurrencyInput
                            value={item.costPrice || ''}
                            onChange={(val) => updateItemCostPrice(index, val)}
                          />
                          {errors[`item_cost_${index}`] && (
                            <p className="text-xs text-error-500">{errors[`item_cost_${index}`]}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 text-right text-sm font-medium tabular-nums text-foreground">
                        Line total: {formatINR(item.quantity * item.costPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Desktop: table layout */
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Variant</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Cost Price</TableHead>
                      <TableHead className="text-right">Line Total</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={item.variantId}>
                        <TableCell className="font-medium">
                          {item.productName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.variantDescription || '\u2014'}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {item.sku}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <NumberStepper
                              value={item.quantity}
                              onChange={(val) => updateItemQuantity(index, val)}
                              min={1}
                              max={9999}
                            />
                          </div>
                          {errors[`item_qty_${index}`] && (
                            <p className="mt-1 text-center text-xs text-error-500">
                              {errors[`item_qty_${index}`]}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <CurrencyInput
                            value={item.costPrice || ''}
                            onChange={(val) => updateItemCostPrice(index, val)}
                            className="ml-auto max-w-32"
                          />
                          {errors[`item_cost_${index}`] && (
                            <p className="mt-1 text-right text-xs text-error-500">
                              {errors[`item_cost_${index}`]}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatINR(item.quantity * item.costPrice)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-error-500"
                            onClick={() => removeItem(index)}
                            aria-label={`Remove ${item.productName}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Running total */}
        {items.length > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
            <span className="text-sm font-medium text-muted-foreground">Total</span>
            <span className="text-lg font-bold tabular-nums text-foreground">
              {formatINR(runningTotal)}
            </span>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="po-notes">Notes</Label>
          <Textarea
            id="po-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes for this purchase order..."
            rows={3}
          />
        </div>

        <Separator />

        {/* Action buttons */}
        <div className="flex flex-col gap-3 desktop:flex-row desktop:justify-end">
          <Button
            variant="outline"
            className="w-full desktop:w-auto"
            onClick={handleSaveDraft}
            disabled={isPending}
          >
            {createMutation.isPending && !sendMutation.isPending
              ? 'Saving...'
              : 'Save as Draft'}
          </Button>
          <Button
            className="w-full desktop:w-auto"
            onClick={handleSaveAndSend}
            disabled={isPending}
          >
            {sendMutation.isPending ? 'Sending...' : 'Save & Send to Supplier'}
          </Button>
        </div>
      </div>
    </div>
  );
}
