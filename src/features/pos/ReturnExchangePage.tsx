import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { differenceInDays, parseISO } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  ShoppingCart,
  AlertTriangle,
  Package,
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
  BarcodeInput,
  NumberStepper,
  SearchInput,
  StatusBadge,
  ConfirmSheet,
  EmptyState,
} from '@/components/shared';

import { useSale, useSales } from '@/hooks/use-sales';
import { useCreateReturn } from '@/hooks/use-returns';
import { useSettings } from '@/hooks/use-settings';
import { useCustomer } from '@/hooks/use-customers';
import { useDebounce } from '@/hooks/use-debounce';
import { productsApi } from '@/api/products.api';
import { salesApi } from '@/api/sales.api';
import { formatINR, parseAmount } from '@/lib/currency';
import { formatDate } from '@/lib/format-date';
import { cn } from '@/lib/cn';
import type { SaleDetail } from '@/api/sales.api';
import type { SaleItem } from '@/types/models';
import type { ReturnReason, ReturnType, RefundMode } from '@/types/enums';
import type { ExchangeItemInput } from '@/api/returns.api';

// ── Local types ──

interface ReturnItemState {
  saleItem: SaleItem;
  returnQty: number;
  reason: ReturnReason | '';
  selected: boolean;
}

interface ExchangeItem {
  variantId: string;
  productName: string;
  variantDescription: string;
  quantity: number;
  mrp: number;
  costPrice: number;
  productDiscountPct: number;
  gstRate: number;
  hsnCode: string | null;
  version: number;
}

const RETURN_REASONS: { value: ReturnReason; label: string }[] = [
  { value: 'size_issue', label: 'Size Issue' },
  { value: 'defect', label: 'Defect' },
  { value: 'changed_mind', label: 'Changed Mind' },
  { value: 'color_mismatch', label: 'Color Mismatch' },
  { value: 'other', label: 'Other' },
];

const STEP_LABELS = [
  'Lookup Bill',
  'Select Items',
  'Return Reason',
  'Return Type',
  'Exchange Items',
  'Refund Summary',
  'Confirm',
];

// ── Step Indicator ──

function StepIndicator({
  currentStep,
  totalSteps,
  labels,
}: {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}) {
  return (
    <div className="px-4 pb-4 desktop:px-6">
      {/* Progress bar */}
      <div className="mb-2 flex gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i < currentStep
                ? 'bg-primary'
                : i === currentStep
                  ? 'bg-primary/50'
                  : 'bg-neutral-200',
            )}
          />
        ))}
      </div>
      <p className="text-xs text-neutral-500">
        Step {currentStep + 1} of {totalSteps}: {labels[currentStep]}
      </p>
    </div>
  );
}

// ── Main Page ──

export default function ReturnExchangePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createReturn = useCreateReturn();

  // Settings for return window
  const { data: settings } = useSettings();
  const returnWindowDays = settings?.returnWindowDays ?? 7;

  // ── Step state ──
  const [step, setStep] = useState(0);

  // ── Step 1: Lookup Bill ──
  const [billSearch, setBillSearch] = useState(searchParams.get('billId') ?? '');
  const [selectedSaleId, setSelectedSaleId] = useState(searchParams.get('billId') ?? '');
  const debouncedBillSearch = useDebounce(billSearch, 300);

  // Search sales by bill number or phone
  const { data: searchResults, isLoading: isSearching } = useSales(
    debouncedBillSearch
      ? {
          search: debouncedBillSearch,
          limit: 10,
        }
      : undefined,
  );
  const searchedSales = searchResults?.data ?? [];

  // Fetch selected sale detail
  const {
    data: saleDetail,
    isLoading: isSaleLoading,
  } = useSale(selectedSaleId);

  // Fetch customer for khata info
  const customerId = saleDetail?.customerId ?? '';
  const { data: customerData } = useCustomer(customerId);
  const customerOutstanding = parseAmount(customerData?.outstandingBalance);

  // ── Step 2: Select Items ──
  const [returnItems, setReturnItems] = useState<ReturnItemState[]>([]);

  // ── Step 4: Return Type ──
  const [returnType, setReturnType] = useState<ReturnType>('partial');

  // ── Step 5: Exchange Items ──
  const [exchangeItems, setExchangeItems] = useState<ExchangeItem[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // ── Step 6: Refund Summary ──
  const [refundMode, setRefundMode] = useState<RefundMode>('cash');
  const [notes, setNotes] = useState('');
  const [overrideReturnWindow, setOverrideReturnWindow] = useState(false);

  // ── Step 7: Confirm ──
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successReturnNumber, setSuccessReturnNumber] = useState('');

  // ── Computed values ──

  const selectedItems = useMemo(
    () => returnItems.filter((it) => it.selected),
    [returnItems],
  );

  const returnAmount = useMemo(
    () =>
      selectedItems.reduce(
        (sum, it) => sum + it.returnQty * parseAmount(it.saleItem.unitPrice),
        0,
      ),
    [selectedItems],
  );

  const exchangeTotal = useMemo(
    () => exchangeItems.reduce((sum, it) => sum + it.quantity * it.mrp, 0),
    [exchangeItems],
  );

  const netDifference = exchangeTotal - returnAmount;

  const isOutsideWindow = useMemo(() => {
    if (!saleDetail) return false;
    const saleDateParsed = parseISO(saleDetail.createdAt);
    return differenceInDays(new Date(), saleDateParsed) > returnWindowDays;
  }, [saleDetail, returnWindowDays]);

  // Determine effective number of steps (skip exchange step if not exchange type)
  const effectiveSteps = returnType === 'exchange' ? 7 : 6;
  const effectiveStepLabels =
    returnType === 'exchange'
      ? STEP_LABELS
      : STEP_LABELS.filter((_, i) => i !== 4);

  // Map step index to logical step considering skip
  const logicalStep = useMemo(() => {
    if (returnType === 'exchange') return step;
    // If not exchange, step 4 is actually summary (logical 5), step 5 is confirm (logical 6)
    if (step <= 3) return step;
    return step + 1; // skip exchange step
  }, [step, returnType]);

  // ── Handlers ──

  const handleBillBarcodeScan = useCallback(
    async (barcode: string) => {
      // Try to find by bill number
      try {
        const result = await salesApi.list({ search: barcode, limit: 1 });
        if (result.data.length > 0) {
          setSelectedSaleId(result.data[0].id);
          setBillSearch(barcode);
          toast.success(`Bill ${result.data[0].billNumber} found`);
        } else {
          toast.error(`No bill found for "${barcode}"`);
        }
      } catch {
        toast.error('Failed to look up bill');
      }
    },
    [],
  );

  const handleSelectSale = useCallback((sale: { id: string; billNumber: string }) => {
    setSelectedSaleId(sale.id);
    setBillSearch(sale.billNumber);
  }, []);

  const initializeReturnItems = useCallback((detail: SaleDetail) => {
    setReturnItems(
      detail.items.map((item) => ({
        saleItem: item,
        returnQty: item.quantity,
        reason: '' as ReturnReason | '',
        selected: false,
      })),
    );
  }, []);

  const handleProceedFromLookup = useCallback(() => {
    if (!saleDetail) {
      toast.error('Please select a bill first');
      return;
    }
    if (saleDetail.status === 'cancelled' || saleDetail.status === 'returned') {
      toast.error(
        `This bill is already ${saleDetail.status}. Cannot process return.`,
      );
      return;
    }
    initializeReturnItems(saleDetail);
    setStep(1);
  }, [saleDetail, initializeReturnItems]);

  const toggleItem = useCallback((index: number, checked: boolean) => {
    setReturnItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? { ...it, selected: checked, returnQty: checked ? it.returnQty : it.saleItem.quantity }
          : it,
      ),
    );
  }, []);

  const updateReturnQty = useCallback((index: number, qty: number) => {
    setReturnItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, returnQty: qty } : it)),
    );
  }, []);

  const updateReason = useCallback((index: number, reason: ReturnReason) => {
    setReturnItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, reason } : it)),
    );
  }, []);

  // Exchange item barcode scan
  const handleExchangeBarcodeScan = useCallback(
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

        const variant =
          productDetail.variants.length === 1
            ? productDetail.variants[0]
            : productDetail.variants.find(
                (v) => v.barcode === barcode || v.sku === barcode,
              ) ?? productDetail.variants[0];

        // Check if already added
        const existingIdx = exchangeItems.findIndex(
          (it) => it.variantId === variant.id,
        );
        if (existingIdx >= 0) {
          setExchangeItems((prev) =>
            prev.map((it, i) =>
              i === existingIdx ? { ...it, quantity: it.quantity + 1 } : it,
            ),
          );
          toast.info(`${productDetail.name} quantity increased`);
          return;
        }

        const desc = variant.attributes
          ? Object.values(variant.attributes).join(' / ')
          : variant.sku;

        setExchangeItems((prev) => [
          ...prev,
          {
            variantId: variant.id,
            productName: productDetail.name,
            variantDescription: desc,
            quantity: 1,
            mrp: parseAmount(variant.mrp),
            costPrice: parseAmount(variant.costPrice),
            productDiscountPct: parseAmount(productDetail.productDiscountPct),
            gstRate: parseAmount(productDetail.gstRate),
            hsnCode: productDetail.hsnCode,
            version: variant.version,
          },
        ]);
      } catch {
        toast.error('Failed to look up product');
      } finally {
        setIsLookingUp(false);
      }
    },
    [isLookingUp, exchangeItems],
  );

  const updateExchangeQty = useCallback((index: number, qty: number) => {
    setExchangeItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, quantity: qty } : it)),
    );
  }, []);

  const removeExchangeItem = useCallback((index: number) => {
    setExchangeItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Validation per step ──

  const canProceed = useMemo(() => {
    switch (logicalStep) {
      case 0:
        return !!saleDetail && saleDetail.status !== 'cancelled' && saleDetail.status !== 'returned';
      case 1:
        return selectedItems.length > 0;
      case 2:
        return selectedItems.every((it) => it.reason !== '');
      case 3:
        return !!returnType;
      case 4: // exchange items
        return exchangeItems.length > 0;
      case 5: // refund summary
        if (isOutsideWindow && !overrideReturnWindow) return false;
        return !!refundMode;
      case 6: // confirm
        return true;
      default:
        return false;
    }
  }, [logicalStep, saleDetail, selectedItems, returnType, exchangeItems, isOutsideWindow, overrideReturnWindow, refundMode]);

  // ── Submit ──

  const handleSubmit = useCallback(() => {
    if (!saleDetail) return;

    const effectiveRefundMode: RefundMode =
      returnType === 'exchange' ? 'exchange' : refundMode;

    createReturn.mutate(
      {
        originalSaleId: saleDetail.id,
        returnType,
        refundMode: effectiveRefundMode,
        items: selectedItems.map((it) => ({
          originalSaleItemId: it.saleItem.id,
          variantId: it.saleItem.variantId ?? '',
          quantity: it.returnQty,
          reason: it.reason as ReturnReason,
        })),
        exchangeItems:
          returnType === 'exchange'
            ? exchangeItems.map<ExchangeItemInput>((it) => ({
                variantId: it.variantId,
                quantity: it.quantity,
                mrp: it.mrp,
                costPrice: it.costPrice,
                productDiscountPct: it.productDiscountPct,
                gstRate: it.gstRate,
                hsnCode: it.hsnCode,
                version: it.version,
              }))
            : undefined,
        notes: notes.trim() || null,
      },
      {
        onSuccess: (res) => {
          setSuccessReturnNumber(res.data.returnNumber);
        },
      },
    );
  }, [saleDetail, returnType, refundMode, selectedItems, exchangeItems, notes, createReturn]);

  // ── Navigation ──

  const goNext = useCallback(() => {
    if (step < effectiveSteps - 1) setStep(step + 1);
  }, [step, effectiveSteps]);

  const goBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  // ── Success screen ──

  if (successReturnNumber) {
    return (
      <div>
        <PageHeader title="Return Processed" />
        <div className="flex flex-col items-center px-4 py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-success-50">
            <Check className="size-8 text-success-500" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-neutral-900">
            Return Successful
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            Return number: <span className="font-semibold">{successReturnNumber}</span>
          </p>
          {returnType === 'exchange' && netDifference > 0 && (
            <p className="mt-1 text-sm text-neutral-500">
              Customer pays additional: {formatINR(netDifference)}
            </p>
          )}
          {returnType === 'exchange' && netDifference < 0 && (
            <p className="mt-1 text-sm text-neutral-500">
              Refund to customer: {formatINR(Math.abs(netDifference))}
            </p>
          )}
          {returnType !== 'exchange' && (
            <p className="mt-1 text-sm text-neutral-500">
              Refund: {formatINR(returnAmount)} via {refundMode.replace('_', ' ')}
            </p>
          )}
          <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
            <Button onClick={() => navigate('/pos')}>
              <ShoppingCart className="size-4" />
              Back to POS
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/pos/bills')}
            >
              View Bills
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step renderers ──

  function renderStep0_LookupBill() {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="size-4 text-neutral-500" />
              Find Original Bill
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Barcode scan */}
            <div className="space-y-1.5">
              <Label>Scan Bill Barcode</Label>
              <BarcodeInput
                onSubmit={handleBillBarcodeScan}
                placeholder="Scan bill barcode"
              />
            </div>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-neutral-400">OR</span>
              <Separator className="flex-1" />
            </div>

            {/* Text search */}
            <div className="space-y-1.5">
              <Label>Search by Bill Number or Phone</Label>
              <SearchInput
                value={billSearch}
                onChange={(v) => {
                  setBillSearch(v);
                  setSelectedSaleId('');
                }}
                placeholder="Bill # or customer phone..."
              />
            </div>

            {/* Search results */}
            {isSearching && (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            )}

            {!isSearching && searchedSales.length > 0 && !selectedSaleId && (
              <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                {searchedSales.map((sale) => (
                  <button
                    key={sale.id}
                    type="button"
                    onClick={() => handleSelectSale(sale)}
                    className={cn(
                      'flex items-center justify-between rounded-lg border border-input p-3 text-left transition-colors',
                      'hover:bg-neutral-50 active:bg-neutral-100',
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {sale.billNumber}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatDate(sale.createdAt)}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-neutral-700">
                      {formatINR(sale.netPayable)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected bill summary */}
        {selectedSaleId && (
          <Card>
            <CardHeader>
              <CardTitle>Bill Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {isSaleLoading ? (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : saleDetail ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-neutral-900">
                      {saleDetail.billNumber}
                    </span>
                    <StatusBadge
                      status={
                        saleDetail.status === 'completed'
                          ? 'green'
                          : saleDetail.status === 'cancelled' || saleDetail.status === 'returned'
                            ? 'red'
                            : 'amber'
                      }
                      label={saleDetail.status.replace('_', ' ')}
                    />
                  </div>
                  <p className="text-xs text-neutral-500">
                    Date: {formatDate(saleDetail.createdAt)}
                  </p>
                  {saleDetail.customer && (
                    <p className="text-xs text-neutral-500">
                      Customer: {saleDetail.customer.name} ({saleDetail.customer.phone})
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">
                      {saleDetail.items.length} item{saleDetail.items.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-sm font-bold tabular-nums">
                      {formatINR(saleDetail.netPayable)}
                    </span>
                  </div>

                  {(saleDetail.status === 'cancelled' || saleDetail.status === 'returned') && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-error-50 p-3">
                      <AlertTriangle className="size-4 text-error-500" />
                      <p className="text-sm text-error-700">
                        This bill is already {saleDetail.status}. Cannot process return.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderStep1_SelectItems() {
    if (!saleDetail) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-4 text-neutral-500" />
            Select Items to Return
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {returnItems.map((item, idx) => (
              <div
                key={item.saleItem.id}
                className={cn(
                  'rounded-lg border p-3 transition-colors',
                  item.selected
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-input',
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={item.selected}
                    onCheckedChange={(c) => toggleItem(idx, !!c)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900">
                      {item.saleItem.productName}
                    </p>
                    {item.saleItem.variantDescription && (
                      <p className="text-xs text-neutral-500">
                        {item.saleItem.variantDescription}
                      </p>
                    )}
                    <p className="text-xs text-neutral-400">
                      Qty: {item.saleItem.quantity} x {formatINR(item.saleItem.unitPrice)}
                      {' = '}
                      {formatINR(item.saleItem.lineTotal)}
                    </p>
                  </div>
                </div>

                {item.selected && (
                  <div className="mt-3 flex items-center gap-3 pl-7">
                    <span className="text-xs text-neutral-500">Return qty:</span>
                    <NumberStepper
                      value={item.returnQty}
                      onChange={(qty) => updateReturnQty(idx, qty)}
                      min={1}
                      max={item.saleItem.quantity}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedItems.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">
                  Returning {selectedItems.reduce((s, it) => s + it.returnQty, 0)} item
                  {selectedItems.reduce((s, it) => s + it.returnQty, 0) !== 1 ? 's' : ''}
                </span>
                <span className="text-lg font-bold text-neutral-900">
                  {formatINR(returnAmount)}
                </span>
              </div>
            </>
          )}

          {selectedItems.length === 0 && (
            <p className="mt-4 text-center text-sm text-neutral-400">
              Select at least 1 item to continue.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderStep2_ReturnReasons() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Return Reason per Item</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {selectedItems.map((item) => {
              const globalIdx = returnItems.findIndex(
                (ri) => ri.saleItem.id === item.saleItem.id,
              );
              return (
                <div key={item.saleItem.id} className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    {item.saleItem.productName}
                    {item.saleItem.variantDescription
                      ? ` - ${item.saleItem.variantDescription}`
                      : ''}
                    {' '}
                    <span className="text-neutral-400">(x{item.returnQty})</span>
                  </Label>
                  <Select
                    value={item.reason || undefined}
                    onValueChange={(val) =>
                      updateReason(globalIdx, (val ?? 'size_issue') as ReturnReason)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select reason..." />
                    </SelectTrigger>
                    <SelectContent>
                      {RETURN_REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}

            {selectedItems.some((it) => it.reason === '') && (
              <p className="text-xs text-amber-600">
                All items must have a reason to continue.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderStep3_ReturnType() {
    const allSelected =
      selectedItems.length === returnItems.length &&
      selectedItems.every((it) => it.returnQty === it.saleItem.quantity);

    const typeOptions: { value: ReturnType; label: string; description: string }[] = [
      {
        value: 'full',
        label: 'Full Return',
        description: 'Refund the entire selected amount',
      },
      {
        value: 'partial',
        label: 'Partial Return',
        description: 'Refund selected items only',
      },
      {
        value: 'exchange',
        label: 'Exchange',
        description: 'Return items + add new items, pay/receive difference',
      },
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle>Return Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setReturnType(opt.value);
                  // Reset exchange items if switching away from exchange
                  if (opt.value !== 'exchange') {
                    setExchangeItems([]);
                  }
                }}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                  returnType === opt.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-input hover:bg-neutral-50',
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex size-5 items-center justify-center rounded-full border-2 transition-colors',
                    returnType === opt.value
                      ? 'border-primary bg-primary'
                      : 'border-neutral-300',
                  )}
                >
                  {returnType === opt.value && (
                    <div className="size-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900">
                    {opt.label}
                  </p>
                  <p className="text-xs text-neutral-500">{opt.description}</p>
                </div>
              </button>
            ))}
          </div>

          {returnType === 'full' && !allSelected && (
            <p className="mt-3 text-xs text-amber-600">
              Note: Not all items/quantities are selected. &quot;Full Return&quot; will
              refund the selected items based on original prices.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderStep4_ExchangeItems() {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="size-4 text-neutral-500" />
            Exchange Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <BarcodeInput
              onSubmit={handleExchangeBarcodeScan}
              placeholder="Scan new item barcode"
            />
            {isLookingUp && (
              <p className="text-xs text-neutral-500">Looking up product...</p>
            )}

            {exchangeItems.length > 0 ? (
              <div className="flex flex-col gap-3">
                {exchangeItems.map((item, idx) => (
                  <div
                    key={item.variantId}
                    className="flex items-center justify-between rounded-lg border border-input p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {item.productName}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {item.variantDescription} &middot; {formatINR(item.mrp)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <NumberStepper
                        value={item.quantity}
                        onChange={(qty) => updateExchangeQty(idx, qty)}
                        min={1}
                      />
                      <button
                        type="button"
                        onClick={() => removeExchangeItem(idx)}
                        className="flex size-8 items-center justify-center rounded-md text-neutral-400 hover:bg-error-50 hover:text-error-500"
                        aria-label={`Remove ${item.productName}`}
                      >
                        <Package className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">New items total</span>
                  <span className="text-lg font-bold">{formatINR(exchangeTotal)}</span>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={ShoppingCart}
                title="No exchange items"
                description="Scan a barcode to add items for exchange."
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderStep5_RefundSummary() {
    const hasKhata = customerOutstanding > 0;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Refund Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Return amount */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">Return amount</span>
              <span className="text-base font-bold tabular-nums text-neutral-900">
                {formatINR(returnAmount)}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Based on original bill prices, not current prices.
            </p>

            {/* Exchange summary */}
            {returnType === 'exchange' && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">New items total</span>
                  <span className="text-base font-bold tabular-nums">
                    {formatINR(exchangeTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700">
                    {netDifference > 0 ? 'Customer pays' : netDifference < 0 ? 'Refund to customer' : 'Even exchange'}
                  </span>
                  <span
                    className={cn(
                      'text-base font-bold tabular-nums',
                      netDifference > 0
                        ? 'text-amber-600'
                        : netDifference < 0
                          ? 'text-success-600'
                          : 'text-neutral-900',
                    )}
                  >
                    {netDifference === 0
                      ? formatINR(0)
                      : formatINR(Math.abs(netDifference))}
                  </span>
                </div>
              </>
            )}

            {/* Khata auto-adjustment */}
            {hasKhata && (
              <>
                <Separator />
                <div className="rounded-lg bg-amber-50 p-3">
                  <p className="text-sm text-amber-800">
                    Customer owes {formatINR(customerOutstanding)}.
                    {returnType !== 'exchange' && (
                      <>
                        {' '}Return of {formatINR(returnAmount)} will reduce khata to{' '}
                        {formatINR(Math.max(0, customerOutstanding - returnAmount))}.
                      </>
                    )}
                  </p>
                </div>
              </>
            )}

            {/* Return window warning */}
            {isOutsideWindow && (
              <>
                <Separator />
                <div className="rounded-lg bg-amber-50 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Outside return window
                      </p>
                      <p className="text-xs text-amber-600">
                        This return is outside the {returnWindowDays}-day window.
                      </p>
                      <label className="mt-2 flex items-center gap-2">
                        <Checkbox
                          checked={overrideReturnWindow}
                          onCheckedChange={(c) => setOverrideReturnWindow(!!c)}
                        />
                        <span className="text-xs text-amber-700">
                          Override and allow this return
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Refund mode selector (not for exchange) */}
            {returnType !== 'exchange' && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <Label>Refund Mode</Label>
                  <Select
                    value={refundMode}
                    onValueChange={(val) => setRefundMode((val ?? 'cash') as RefundMode)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select refund mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="store_credit">Store Credit</SelectItem>
                      <SelectItem value="khata">Khata (Reduce Balance)</SelectItem>
                    </SelectContent>
                  </Select>
                  {hasKhata && refundMode !== 'khata' && (
                    <p className="text-xs text-amber-600">
                      Customer has outstanding khata balance. Consider selecting Khata refund.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Add any notes about this return..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderStep6_Confirm() {
    if (!saleDetail) return null;

    const effectiveRefundMode: RefundMode =
      returnType === 'exchange' ? 'exchange' : refundMode;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="size-4 text-success-500" />
            Confirm Return
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {/* Bill info */}
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs text-neutral-500">Original Bill</p>
              <p className="text-sm font-semibold text-neutral-900">
                {saleDetail.billNumber}
              </p>
              {saleDetail.customer && (
                <p className="text-xs text-neutral-500">
                  {saleDetail.customer.name} ({saleDetail.customer.phone})
                </p>
              )}
            </div>

            <Separator />

            {/* Return items */}
            <div>
              <p className="mb-2 text-xs font-medium text-neutral-500 uppercase">
                Returning
              </p>
              {selectedItems.map((item) => (
                <div
                  key={item.saleItem.id}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-neutral-900">
                      {item.saleItem.productName}
                      {item.saleItem.variantDescription
                        ? ` (${item.saleItem.variantDescription})`
                        : ''}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {RETURN_REASONS.find((r) => r.value === item.reason)?.label ?? item.reason}
                    </p>
                  </div>
                  <span className="text-sm tabular-nums text-neutral-700">
                    {item.returnQty} x {formatINR(item.saleItem.unitPrice)}
                  </span>
                </div>
              ))}
            </div>

            {/* Exchange items */}
            {returnType === 'exchange' && exchangeItems.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="mb-2 text-xs font-medium text-neutral-500 uppercase">
                    New Items (Exchange)
                  </p>
                  {exchangeItems.map((item) => (
                    <div
                      key={item.variantId}
                      className="flex items-center justify-between py-1.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-neutral-900">
                          {item.productName}
                          {item.variantDescription
                            ? ` (${item.variantDescription})`
                            : ''}
                        </p>
                      </div>
                      <span className="text-sm tabular-nums text-neutral-700">
                        {item.quantity} x {formatINR(item.mrp)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <Separator />

            {/* Financial summary */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Return amount</span>
                <span className="font-medium tabular-nums">{formatINR(returnAmount)}</span>
              </div>
              {returnType === 'exchange' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">New items total</span>
                    <span className="font-medium tabular-nums">{formatINR(exchangeTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>
                      {netDifference > 0 ? 'Customer pays' : netDifference < 0 ? 'Refund' : 'Even'}
                    </span>
                    <span className="tabular-nums">
                      {formatINR(Math.abs(netDifference))}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Return type</span>
                <span className="capitalize">{returnType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Refund mode</span>
                <span className="capitalize">{effectiveRefundMode.replace('_', ' ')}</span>
              </div>
              {notes.trim() && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Notes</span>
                  <span className="max-w-[60%] truncate text-right text-neutral-700">
                    {notes.trim()}
                  </span>
                </div>
              )}
            </div>

            {isOutsideWindow && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-2">
                <AlertTriangle className="size-4 text-amber-500" />
                <p className="text-xs text-amber-700">
                  Return window override applied
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Render current step ──

  function renderCurrentStep() {
    switch (logicalStep) {
      case 0:
        return renderStep0_LookupBill();
      case 1:
        return renderStep1_SelectItems();
      case 2:
        return renderStep2_ReturnReasons();
      case 3:
        return renderStep3_ReturnType();
      case 4:
        return renderStep4_ExchangeItems();
      case 5:
        return renderStep5_RefundSummary();
      case 6:
        return renderStep6_Confirm();
      default:
        return null;
    }
  }

  // Auto-set refund mode to khata when customer has outstanding balance
  // Done as a side effect of rendering step 5
  const isOnSummaryStep = logicalStep === 5;
  if (isOnSummaryStep && customerOutstanding > 0 && returnType !== 'exchange' && refundMode === 'cash') {
    // Use a microtask to avoid setting state during render
    Promise.resolve().then(() => setRefundMode('khata'));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader
        title="Return / Exchange"
        showBack
        onBack={step === 0 ? undefined : goBack}
      />

      <StepIndicator
        currentStep={step}
        totalSteps={effectiveSteps}
        labels={effectiveStepLabels}
      />

      <div className="flex-1 px-4 pb-6 desktop:max-w-2xl desktop:px-6">
        {renderCurrentStep()}
      </div>

      {/* Navigation buttons */}
      <div className="sticky bottom-0 border-t border-neutral-200 bg-white px-4 py-3 desktop:px-6">
        <div className="mx-auto flex max-w-2xl gap-3">
          {step > 0 && (
            <Button variant="outline" className="flex-1" onClick={goBack}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          )}

          {logicalStep < 6 ? (
            <Button
              className="flex-1"
              onClick={logicalStep === 0 ? handleProceedFromLookup : goNext}
              disabled={!canProceed}
            >
              {logicalStep === 0 ? 'Continue' : 'Next'}
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={() => setConfirmOpen(true)}
              disabled={createReturn.isPending}
            >
              <RotateCcw className="size-4" />
              {createReturn.isPending ? 'Processing...' : 'Process Return'}
            </Button>
          )}
        </div>
      </div>

      {/* Confirm Sheet */}
      <ConfirmSheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Process Return?"
        description={
          returnType === 'exchange'
            ? `Exchange ${selectedItems.reduce((s, it) => s + it.returnQty, 0)} item(s) worth ${formatINR(returnAmount)} for new items worth ${formatINR(exchangeTotal)}.`
            : `Return ${selectedItems.reduce((s, it) => s + it.returnQty, 0)} item(s) worth ${formatINR(returnAmount)} via ${refundMode.replace('_', ' ')}.`
        }
        confirmLabel="Process Return"
        variant="destructive"
        onConfirm={handleSubmit}
      />
    </div>
  );
}
