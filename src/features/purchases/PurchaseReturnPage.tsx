import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Truck,
  Package,
  Search,
  XCircle,
  Trash2,
  CheckCircle,
  FileText,
} from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import {
  BarcodeInput,
  NumberStepper,
  SearchInput,
  EmptyState,
  ConfirmSheet,
} from '@/components/shared';

import { useSuppliers } from '@/hooks/use-suppliers';
import {
  useGoodsReceipts,
  useGoodsReceipt,
  useCreatePurchaseReturn,
} from '@/hooks/use-purchases';
import { productsApi } from '@/api/products.api';
import type { GoodsReceipt } from '@/api/purchases.api';
import { formatINR } from '@/lib/currency';
import { formatDate } from '@/lib/format-date';
import { cn } from '@/lib/cn';

// ── Types ──

interface ReturnItem {
  variantId: string;
  productName: string;
  variantDescription: string;
  quantity: number;
  costPrice: number;
  maxQuantity?: number; // from original receipt
}

// ── Receipt Picker Dialog ──

function ReceiptPickerDialog({
  open,
  onOpenChange,
  receipts,
  isLoading,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipts: GoodsReceipt[];
  isLoading: boolean;
  onSelect: (receipt: GoodsReceipt) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Receipt</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : receipts.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">
            No receipts found for this supplier.
          </p>
        ) : (
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {receipts.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  onSelect(r);
                  onOpenChange(false);
                }}
                className={cn(
                  'flex items-center justify-between rounded-lg border border-input p-3 text-left transition-colors',
                  'hover:bg-neutral-50 active:bg-neutral-100',
                )}
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    #{r.receiptNumber}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatDate(r.createdAt)} &middot; {r.totalQuantity} items
                  </p>
                </div>
                <span className="text-sm font-medium text-neutral-700">
                  {formatINR(r.totalAmount)}
                </span>
              </button>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──

export default function PurchaseReturnPage() {
  const navigate = useNavigate();
  const createReturn = useCreatePurchaseReturn();

  // Supplier
  const [supplierSearch, setSupplierSearch] = useState('');
  const { data: suppliersData } = useSuppliers({
    search: supplierSearch || undefined,
    limit: 20,
    isActive: 'true',
  });
  const suppliers = suppliersData?.data ?? [];

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [selectedReceiptId, setSelectedReceiptId] = useState('');
  const [reason, setReason] = useState('');
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);

  // Receipt picker
  const [receiptPickerOpen, setReceiptPickerOpen] = useState(false);
  const { data: receiptsData, isLoading: receiptsLoading } = useGoodsReceipts(
    supplierId ? { supplierId, limit: 50 } : undefined,
  );
  const receipts = receiptsData?.data ?? [];

  // Load receipt detail when one is selected
  const { data: receiptDetail, isLoading: receiptDetailLoading } =
    useGoodsReceipt(selectedReceiptId);

  // Confirm sheet
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Success state
  const [isSuccess, setIsSuccess] = useState(false);

  // Barcode lookup
  const [isLookingUp, setIsLookingUp] = useState(false);

  // ── Computed ──

  const totalReturnAmount = useMemo(
    () => returnItems.reduce((sum, it) => sum + it.quantity * it.costPrice, 0),
    [returnItems],
  );

  const totalReturnQty = useMemo(
    () => returnItems.reduce((sum, it) => sum + it.quantity, 0),
    [returnItems],
  );

  // ── Handlers ──

  const handleSupplierChange = (id: string | null) => {
    setSupplierId(id ?? '');
    setSelectedReceiptId('');
    setReturnItems([]);
  };

  const handleReceiptSelect = (receipt: GoodsReceipt) => {
    setSelectedReceiptId(receipt.id);
    setReturnItems([]);
  };

  const clearReceipt = () => {
    setSelectedReceiptId('');
    setReturnItems([]);
  };

  // Toggle an item from the receipt for return
  const toggleReceiptItem = useCallback(
    (variantId: string, checked: boolean) => {
      if (!receiptDetail) return;

      if (checked) {
        const item = receiptDetail.items.find((it) => it.variantId === variantId);
        if (!item) return;

        setReturnItems((prev) => [
          ...prev,
          {
            variantId: item.variantId,
            productName: item.productName,
            variantDescription: item.variantDescription,
            quantity: 1,
            costPrice: parseFloat(item.costPrice) || 0,
            maxQuantity: item.quantityReceived,
          },
        ]);
      } else {
        setReturnItems((prev) => prev.filter((it) => it.variantId !== variantId));
      }
    },
    [receiptDetail],
  );

  const updateReturnQty = useCallback((index: number, qty: number) => {
    setReturnItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, quantity: qty } : it)),
    );
  }, []);

  const removeReturnItem = useCallback((index: number) => {
    setReturnItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Manual barcode add (no receipt selected)
  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      if (isLookingUp) return;
      setIsLookingUp(true);

      try {
        const searchResult = await productsApi.list({ search: barcode, limit: 1 });
        if (!searchResult.data.length) {
          toast.error(`No product found for "${barcode}"`);
          return;
        }

        const product = searchResult.data[0];
        const detail = await productsApi.get(product.id);
        const productDetail = detail.data;

        if (productDetail.variants.length === 0) {
          toast.error(`${productDetail.name} has no variants`);
          return;
        }

        // For simplicity, if single variant add it; otherwise use the first
        const variant =
          productDetail.variants.length === 1
            ? productDetail.variants[0]
            : productDetail.variants.find(
                (v) => v.barcode === barcode || v.sku === barcode,
              ) ?? productDetail.variants[0];

        // Check if already added
        const existing = returnItems.findIndex(
          (it) => it.variantId === variant.id,
        );
        if (existing >= 0) {
          setReturnItems((prev) =>
            prev.map((it, i) =>
              i === existing ? { ...it, quantity: it.quantity + 1 } : it,
            ),
          );
          toast.info(`${productDetail.name} quantity increased`);
          return;
        }

        const desc = variant.attributes
          ? Object.values(variant.attributes).join(' / ')
          : variant.sku;

        setReturnItems((prev) => [
          ...prev,
          {
            variantId: variant.id,
            productName: productDetail.name,
            variantDescription: desc,
            quantity: 1,
            costPrice: parseFloat(variant.costPrice) || 0,
          },
        ]);
      } catch {
        toast.error('Failed to look up product');
      } finally {
        setIsLookingUp(false);
      }
    },
    [isLookingUp, returnItems],
  );

  // ── Validation & Submit ──

  const validate = (): string | null => {
    if (!supplierId) return 'Please select a supplier';
    if (returnItems.length === 0) return 'Please select items to return';
    for (const item of returnItems) {
      if (item.quantity <= 0)
        return `${item.productName}: quantity must be greater than 0`;
      if (item.maxQuantity && item.quantity > item.maxQuantity)
        return `${item.productName}: return quantity cannot exceed received quantity (${item.maxQuantity})`;
    }
    return null;
  };

  const handleConfirmReturn = () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    setConfirmOpen(true);
  };

  const handleSubmit = () => {
    createReturn.mutate(
      {
        supplierId,
        receiptId: selectedReceiptId || null,
        reason: reason.trim() || null,
        items: returnItems.map((it) => ({
          variantId: it.variantId,
          quantity: it.quantity,
          costPrice: it.costPrice,
        })),
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
        },
      },
    );
  };

  const resetForm = () => {
    setSupplierId('');
    setSelectedReceiptId('');
    setReason('');
    setReturnItems([]);
    setIsSuccess(false);
  };

  // ── Success ──

  if (isSuccess) {
    return (
      <div>
        <PageHeader title="Purchase Return" showBack />
        <div className="flex flex-col items-center px-4 py-12 text-center">
          <CheckCircle className="size-16 text-success-500" />
          <h2 className="mt-4 text-xl font-bold text-neutral-900">
            Return Recorded
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            {totalReturnQty} item{totalReturnQty !== 1 ? 's' : ''} returned
            totalling {formatINR(totalReturnAmount)}
          </p>
          <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
            <Button variant="outline" onClick={resetForm}>
              Record Another Return
            </Button>
            <Button onClick={() => navigate('/purchases')}>Done</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Determine if we're showing receipt items or manual entry ──

  const showReceiptItems = !!selectedReceiptId && !!receiptDetail;
  const isItemChecked = (variantId: string) =>
    returnItems.some((it) => it.variantId === variantId);

  return (
    <div>
      <PageHeader title="Purchase Return" showBack />

      <div className="flex flex-col gap-6 px-4 pb-8 desktop:max-w-2xl desktop:px-6">
        {/* Step 1: Select Supplier */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="size-4 text-neutral-500" />
              Supplier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="return-supplier">
                Supplier <span className="text-error-500">*</span>
              </Label>
              <Select value={supplierId} onValueChange={handleSupplierChange}>
                <SelectTrigger className="w-full" id="return-supplier">
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <SearchInput
                      value={supplierSearch}
                      onChange={setSupplierSearch}
                      placeholder="Search suppliers..."
                    />
                  </div>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                  {suppliers.length === 0 && (
                    <p className="px-3 py-2 text-sm text-neutral-500">
                      No suppliers found
                    </p>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Select Receipt (optional) */}
        {supplierId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-4 text-neutral-500" />
                Original Receipt
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedReceiptId ? (
                <div className="flex items-center justify-between rounded-lg border border-input p-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      #{receiptDetail?.receiptNumber ?? '...'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {receiptDetail
                        ? `${formatDate(receiptDetail.createdAt)} \u00b7 ${receiptDetail.totalQuantity} items \u00b7 ${formatINR(receiptDetail.totalAmount)}`
                        : 'Loading...'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearReceipt}
                    aria-label="Clear receipt selection"
                  >
                    <XCircle className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-neutral-500">
                    Optionally link this return to an original receipt.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setReceiptPickerOpen(true)}
                  >
                    <Search className="size-4" />
                    Select Receipt
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Select Items */}
        {supplierId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-4 text-neutral-500" />
                Items to Return
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showReceiptItems ? (
                /* Receipt items with checkboxes */
                receiptDetailLoading ? (
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {receiptDetail.items.map((item) => {
                      const checked = isItemChecked(item.variantId);
                      const returnItem = returnItems.find(
                        (ri) => ri.variantId === item.variantId,
                      );
                      const returnIdx = returnItems.findIndex(
                        (ri) => ri.variantId === item.variantId,
                      );

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            'rounded-lg border p-3 transition-colors',
                            checked
                              ? 'border-primary/50 bg-primary/5'
                              : 'border-input',
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(c) =>
                                toggleReceiptItem(item.variantId, !!c)
                              }
                              className="mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-neutral-900">
                                {item.productName}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {item.variantDescription} &middot;{' '}
                                {formatINR(item.costPrice)} each
                              </p>
                              <p className="text-xs text-neutral-400">
                                Received: {item.quantityReceived}
                              </p>
                            </div>
                          </div>

                          {checked && returnItem && (
                            <div className="mt-3 flex items-center gap-3 pl-7">
                              <span className="text-xs text-neutral-500">
                                Return qty:
                              </span>
                              <NumberStepper
                                value={returnItem.quantity}
                                onChange={(qty) => updateReturnQty(returnIdx, qty)}
                                min={1}
                                max={returnItem.maxQuantity ?? 999}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* Manual entry via barcode */
                <div className="flex flex-col gap-4">
                  <BarcodeInput
                    onSubmit={handleBarcodeScan}
                    placeholder="Scan barcode or search product"
                  />
                  {isLookingUp && (
                    <p className="text-xs text-neutral-500">
                      Looking up product...
                    </p>
                  )}

                  {returnItems.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {returnItems.map((item, idx) => (
                        <div
                          key={item.variantId}
                          className="flex items-center justify-between rounded-lg border border-input p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-neutral-900">
                              {item.productName}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {item.variantDescription} &middot;{' '}
                              {formatINR(item.costPrice)} each
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <NumberStepper
                              value={item.quantity}
                              onChange={(qty) => updateReturnQty(idx, qty)}
                              min={1}
                            />
                            <button
                              type="button"
                              onClick={() => removeReturnItem(idx)}
                              className="flex size-8 items-center justify-center rounded-md text-neutral-400 hover:bg-error-50 hover:text-error-500"
                              aria-label={`Remove ${item.productName}`}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {returnItems.length === 0 && (
                    <EmptyState
                      icon={Package}
                      title="No items added"
                      description="Scan a barcode to add items for return."
                    />
                  )}
                </div>
              )}

              {/* Return summary */}
              {returnItems.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">
                      Returning {totalReturnQty} item
                      {totalReturnQty !== 1 ? 's' : ''}
                    </span>
                    <span className="text-lg font-bold text-neutral-900">
                      {formatINR(totalReturnAmount)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Reason */}
        {supplierId && returnItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Reason for return (optional)"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        {supplierId && returnItems.length > 0 && (
          <Button
            className="w-full"
            variant="destructive"
            onClick={handleConfirmReturn}
            disabled={createReturn.isPending}
          >
            {createReturn.isPending ? 'Processing...' : 'Submit Return'}
          </Button>
        )}
      </div>

      {/* Receipt Picker */}
      <ReceiptPickerDialog
        open={receiptPickerOpen}
        onOpenChange={setReceiptPickerOpen}
        receipts={receipts}
        isLoading={receiptsLoading}
        onSelect={handleReceiptSelect}
      />

      {/* Confirm Sheet */}
      <ConfirmSheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm Purchase Return"
        description={`Return ${totalReturnQty} item${totalReturnQty !== 1 ? 's' : ''} worth ${formatINR(totalReturnAmount)}? This will reduce your inventory.`}
        confirmLabel="Confirm Return"
        variant="destructive"
        onConfirm={handleSubmit}
      />
    </div>
  );
}
