import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Truck,
  Plus,
  Trash2,
  Package,
  CheckCircle,
  IndianRupee,
  FileText,
} from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import {
  BarcodeInput,
  CurrencyInput,
  NumberStepper,
  EmptyState,
  SearchInput,
} from '@/components/shared';

import { useSuppliers } from '@/hooks/use-suppliers';
import { useGstConfig } from '@/hooks/use-settings';
import { useCreateGoodsReceipt } from '@/hooks/use-purchases';
import { productsApi, type ProductDetail } from '@/api/products.api';
import type { GoodsReceiptDetail } from '@/api/purchases.api';
import type { ReceiptPaymentMode } from '@/types/enums';
import type { ProductVariant } from '@/types/models';
import { formatINR } from '@/lib/currency';
import { useIsMobile } from '@/hooks/use-media-query';
import { cn } from '@/lib/cn';

// ── Types ──

interface ReceiptFormItem {
  variantId: string;
  productName: string;
  variantDescription: string;
  sku: string;
  quantityReceived: number;
  costPrice: number;
  gstRate: number;
}

const PAYMENT_MODE_OPTIONS: { value: ReceiptPaymentMode; label: string }[] = [
  { value: 'paid', label: 'Paid' },
  { value: 'credit', label: 'Credit' },
  { value: 'partial', label: 'Partial' },
];

// ── Variant Picker Dialog ──

function VariantPickerDialog({
  open,
  onOpenChange,
  product,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductDetail | null;
  onSelect: (variant: ProductVariant) => void;
}) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Variant — {product.name}</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {product.variants.map((v) => {
            const desc = v.attributes
              ? Object.values(v.attributes).join(' / ')
              : v.sku;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  onSelect(v);
                  onOpenChange(false);
                }}
                className={cn(
                  'flex items-center justify-between rounded-lg border border-input p-3 text-left transition-colors',
                  'hover:bg-neutral-50 active:bg-neutral-100',
                )}
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">{desc}</p>
                  <p className="text-xs text-neutral-500">SKU: {v.sku}</p>
                </div>
                <span className="text-sm font-medium text-neutral-700">
                  {formatINR(v.costPrice)}
                </span>
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Success View ──

function SuccessView({
  receipt,
  onRecordAnother,
  onDone,
}: {
  receipt: GoodsReceiptDetail;
  onRecordAnother: () => void;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <CheckCircle className="size-16 text-success-500" />
      <h2 className="mt-4 text-xl font-bold text-neutral-900">
        Stock Received!
      </h2>
      <p className="mt-2 text-sm text-neutral-500">
        Receipt <span className="font-medium text-neutral-700">#{receipt.receiptNumber}</span> recorded
        successfully.
      </p>
      <p className="mt-1 text-sm text-neutral-500">
        {receipt.totalQuantity} items totalling {formatINR(receipt.totalAmount)}
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <Button variant="outline" onClick={onRecordAnother}>
          <Plus className="size-4" />
          Record Another
        </Button>
        <Button onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}

// ── Item Row (mobile card) ──

function ItemCardMobile({
  item,
  index,
  onUpdateQty,
  onUpdateCost,
  onRemove,
}: {
  item: ReceiptFormItem;
  index: number;
  onUpdateQty: (index: number, qty: number) => void;
  onUpdateCost: (index: number, cost: number | '') => void;
  onRemove: (index: number) => void;
}) {
  const lineTotal = item.quantityReceived * item.costPrice;
  return (
    <div className="rounded-lg border border-input p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-neutral-900">
            {item.productName}
          </p>
          <p className="text-xs text-neutral-500">{item.variantDescription}</p>
          <p className="text-xs text-neutral-400">SKU: {item.sku}</p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-error-50 hover:text-error-500"
          aria-label={`Remove ${item.productName}`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs text-neutral-500">Qty</p>
          <NumberStepper
            value={item.quantityReceived}
            onChange={(qty) => onUpdateQty(index, qty)}
            min={1}
          />
        </div>
        <div className="w-28 space-y-1">
          <p className="text-xs text-neutral-500">Cost</p>
          <CurrencyInput
            value={item.costPrice || ''}
            onChange={(v) => onUpdateCost(index, v)}
          />
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-500">Total</p>
          <p className="text-sm font-semibold text-neutral-900">
            {formatINR(lineTotal)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function GoodsReceiptPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const createReceipt = useCreateGoodsReceipt();

  // Supplier search/select
  const [supplierSearch, setSupplierSearch] = useState('');
  const { data: suppliersData } = useSuppliers({
    search: supplierSearch || undefined,
    limit: 20,
    isActive: 'true',
  });
  const suppliers = suppliersData?.data ?? [];

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [supplierInvoiceDate, setSupplierInvoiceDate] = useState('');
  const [paymentMode, setPaymentMode] = useState<ReceiptPaymentMode | ''>('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ReceiptFormItem[]>([]);

  // Variant picker
  const [pickerProduct, setPickerProduct] = useState<ProductDetail | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Success state
  const [savedReceipt, setSavedReceipt] = useState<GoodsReceiptDetail | null>(null);

  // Barcode scanning state
  const [isLookingUp, setIsLookingUp] = useState(false);

  // ── Computed values ──

  const totalAmount = useMemo(
    () => items.reduce((sum, it) => sum + it.quantityReceived * it.costPrice, 0),
    [items],
  );

  const totalQuantity = useMemo(
    () => items.reduce((sum, it) => sum + it.quantityReceived, 0),
    [items],
  );

  // ── Item management ──

  const addVariantToItems = useCallback(
    (variant: ProductVariant, productName: string) => {
      // Check if already added
      const existing = items.findIndex((it) => it.variantId === variant.id);
      if (existing >= 0) {
        // Increment quantity instead of duplicating
        setItems((prev) =>
          prev.map((it, i) =>
            i === existing
              ? { ...it, quantityReceived: it.quantityReceived + 1 }
              : it,
          ),
        );
        toast.info(`${productName} quantity increased`);
        return;
      }

      const desc = variant.attributes
        ? Object.values(variant.attributes).join(' / ')
        : variant.sku;

      setItems((prev) => [
        ...prev,
        {
          variantId: variant.id,
          productName,
          variantDescription: desc,
          sku: variant.sku,
          quantityReceived: 1,
          costPrice: parseFloat(variant.costPrice) || 0,
          gstRate: 0,
        },
      ]);
    },
    [items],
  );

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

        if (productDetail.variants.length === 1) {
          // Single variant — add directly
          addVariantToItems(productDetail.variants[0], productDetail.name);
        } else {
          // Multiple variants — show picker
          setPickerProduct(productDetail);
          setPickerOpen(true);
        }
      } catch {
        toast.error('Failed to look up product');
      } finally {
        setIsLookingUp(false);
      }
    },
    [isLookingUp, addVariantToItems],
  );

  const updateItemQty = useCallback((index: number, qty: number) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, quantityReceived: qty } : it)),
    );
  }, []);

  const updateItemCost = useCallback((index: number, cost: number | '') => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, costPrice: cost === '' ? 0 : cost } : it,
      ),
    );
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Validation & Submit ──

  const validate = (): string | null => {
    if (!supplierId) return 'Please select a supplier';
    if (!paymentMode) return 'Please select a payment mode';
    if (items.length === 0) return 'Please add at least one item';
    for (const item of items) {
      if (item.quantityReceived <= 0)
        return `${item.productName}: quantity must be greater than 0`;
      if (item.costPrice <= 0)
        return `${item.productName}: cost price must be greater than 0`;
    }
    return null;
  };

  const handleSubmit = () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    createReceipt.mutate(
      {
        supplierId,
        supplierInvoiceNumber: supplierInvoiceNumber.trim() || null,
        supplierInvoiceDate: supplierInvoiceDate || null,
        paymentMode: paymentMode as ReceiptPaymentMode,
        notes: notes.trim() || null,
        items: items.map((it) => ({
          variantId: it.variantId,
          quantityReceived: it.quantityReceived,
          costPrice: it.costPrice,
        })),
      },
      {
        onSuccess: (res) => {
          setSavedReceipt(res.data);
        },
      },
    );
  };

  const resetForm = () => {
    setSupplierId('');
    setSupplierInvoiceNumber('');
    setSupplierInvoiceDate('');
    setPaymentMode('');
    setNotes('');
    setItems([]);
    setSavedReceipt(null);
  };

  // ── Success state ──

  if (savedReceipt) {
    return (
      <div>
        <PageHeader title="Goods Receipt" showBack />
        <SuccessView
          receipt={savedReceipt}
          onRecordAnother={resetForm}
          onDone={() => navigate('/purchases')}
        />
      </div>
    );
  }

  // ── Main Form ──

  return (
    <div>
      <PageHeader title="Receive Goods" showBack />

      <div className="flex flex-col gap-6 px-4 pb-8 desktop:max-w-2xl desktop:px-6">
        {/* Section 1: Supplier & Invoice Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="size-4 text-neutral-500" />
              Supplier & Invoice
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Supplier Select */}
            <div className="space-y-1.5">
              <Label htmlFor="supplier">
                Supplier <span className="text-error-500">*</span>
              </Label>
              <Select value={supplierId} onValueChange={(val) => setSupplierId(val ?? '')}>
                <SelectTrigger className="w-full" id="supplier">
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

            {/* Invoice Number */}
            <div className="space-y-1.5">
              <Label htmlFor="invoice-number">Supplier Invoice #</Label>
              <Input
                id="invoice-number"
                placeholder="e.g. INV-2026-001"
                value={supplierInvoiceNumber}
                onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
              />
            </div>

            {/* Invoice Date */}
            <div className="space-y-1.5">
              <Label htmlFor="invoice-date">Supplier Invoice Date</Label>
              <Input
                id="invoice-date"
                type="date"
                value={supplierInvoiceDate}
                onChange={(e) => setSupplierInvoiceDate(e.target.value)}
              />
            </div>

            {/* Payment Mode */}
            <div className="space-y-1.5">
              <Label htmlFor="payment-mode">
                Payment Mode <span className="text-error-500">*</span>
              </Label>
              <Select
                value={paymentMode}
                onValueChange={(v) => setPaymentMode(v as ReceiptPaymentMode)}
              >
                <SelectTrigger className="w-full" id="payment-mode">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Add Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-4 text-neutral-500" />
              Add Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarcodeInput
              onSubmit={handleBarcodeScan}
              placeholder="Scan barcode or search product"
            />
            {isLookingUp && (
              <p className="mt-2 text-xs text-neutral-500">Looking up product...</p>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Items List */}
        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-4 text-neutral-500" />
                Items ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                /* Mobile: card list */
                <div className="flex flex-col gap-3">
                  {items.map((item, idx) => (
                    <ItemCardMobile
                      key={item.variantId}
                      item={item}
                      index={idx}
                      onUpdateQty={updateItemQty}
                      onUpdateCost={updateItemCost}
                      onRemove={removeItem}
                    />
                  ))}
                </div>
              ) : (
                /* Desktop: table */
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 pr-2 font-medium text-neutral-500">Product</th>
                        <th className="pb-2 pr-2 font-medium text-neutral-500">Variant</th>
                        <th className="pb-2 pr-2 font-medium text-neutral-500">Qty</th>
                        <th className="pb-2 pr-2 font-medium text-neutral-500">Cost Price</th>
                        <th className="pb-2 pr-2 text-right font-medium text-neutral-500">Line Total</th>
                        <th className="pb-2 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => {
                        const lineTotal = item.quantityReceived * item.costPrice;
                        return (
                          <tr key={item.variantId} className="border-b last:border-0">
                            <td className="py-2 pr-2">
                              <p className="font-medium text-neutral-900">{item.productName}</p>
                              <p className="text-xs text-neutral-400">SKU: {item.sku}</p>
                            </td>
                            <td className="py-2 pr-2 text-neutral-700">
                              {item.variantDescription}
                            </td>
                            <td className="py-2 pr-2">
                              <NumberStepper
                                value={item.quantityReceived}
                                onChange={(qty) => updateItemQty(idx, qty)}
                                min={1}
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <CurrencyInput
                                value={item.costPrice || ''}
                                onChange={(v) => updateItemCost(idx, v)}
                                className="w-32"
                              />
                            </td>
                            <td className="py-2 pr-2 text-right font-medium text-neutral-900">
                              {formatINR(lineTotal)}
                            </td>
                            <td className="py-2">
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="flex size-8 items-center justify-center rounded-md text-neutral-400 hover:bg-error-50 hover:text-error-500"
                                aria-label={`Remove ${item.productName}`}
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Running total */}
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">
                  {totalQuantity} item{totalQuantity !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1 text-lg font-bold text-neutral-900">
                  <IndianRupee className="size-4" />
                  {formatINR(totalAmount)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {items.length === 0 && (
          <EmptyState
            icon={Package}
            title="No items added"
            description="Scan a barcode or search for a product above to add items to this receipt."
          />
        )}

        {/* Section 4: Notes & Submit */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Textarea
              placeholder="Optional notes about this receipt..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </CardContent>
        </Card>

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={createReceipt.isPending}
        >
          {createReceipt.isPending ? 'Saving...' : 'Save Receipt'}
        </Button>
      </div>

      {/* Variant Picker Dialog */}
      <VariantPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        product={pickerProduct}
        onSelect={(variant) => {
          if (pickerProduct) {
            addVariantToItems(variant, pickerProduct.name);
          }
        }}
      />
    </div>
  );
}
