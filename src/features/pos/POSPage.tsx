import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  ParkingCircle,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { BarcodeInput, ConfirmSheet, EmptyState, PinKeypad } from '@/components/shared';

import {
  CustomerSelector,
  CartItemRow,
  CartSummary,
  DiscountControls,
} from '@/features/pos/components';

import { productsApi } from '@/api/products.api';
import { useCartStore } from '@/stores/cart.store';
import { useParkBill, useVerifyPin } from '@/hooks/use-sales';
import { useSettings } from '@/hooks/use-settings';
import { useBackGuard } from '@/hooks/use-back-guard';
import { formatINR } from '@/lib/currency';
import { isDiscountOverCap } from '@/lib/discount-engine';

// ── Main Page ──

export default function POSPage() {
  const navigate = useNavigate();

  // ── Cart store ──
  const customer = useCartStore((s) => s.customer);
  const items = useCartStore((s) => s.items);
  const discountResult = useCartStore((s) => s.discountResult);
  const billDiscountPct = useCartStore((s) => s.billDiscountPct);
  const bargainAdjustment = useCartStore((s) => s.bargainAdjustment);
  const finalPriceOverride = useCartStore((s) => s.finalPriceOverride);
  const approvalToken = useCartStore((s) => s.approvalToken);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const setBillDiscountPct = useCartStore((s) => s.setBillDiscountPct);
  const setBargainAdjustment = useCartStore((s) => s.setBargainAdjustment);
  const setFinalPriceOverride = useCartStore((s) => s.setFinalPriceOverride);
  const setApprovalToken = useCartStore((s) => s.setApprovalToken);
  const clearCart = useCartStore((s) => s.clearCart);

  // ── Hooks ──
  const { data: settings } = useSettings();
  const parkBill = useParkBill();
  const verifyPin = useVerifyPin();

  // ── Local state ──
  const [customerSelectorOpen, setCustomerSelectorOpen] = useState(false);
  const [discountSheetOpen, setDiscountSheetOpen] = useState(false);
  const [bargainSheetOpen, setBargainSheetOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);

  const defaultDiscountApplied = useRef(false);

  // ── On mount: auto-open customer selector if none, set default discount ──
  useEffect(() => {
    if (!customer) {
      setCustomerSelectorOpen(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (settings && !defaultDiscountApplied.current && items.length === 0) {
      const defaultPct = parseFloat(settings.defaultBillDiscountPct) || 0;
      if (defaultPct > 0) {
        setBillDiscountPct(defaultPct);
      }
      defaultDiscountApplied.current = true;
    }
  }, [settings, items.length, setBillDiscountPct]);

  // ── Back guard ──
  useBackGuard(
    items.length > 0,
    useCallback(() => setDiscardConfirmOpen(true), []),
  );

  // ── Barcode scan handler ──
  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      if (scanBusy) return;
      setScanBusy(true);
      try {
        // Step 1: Search for product by barcode
        const searchResult = await productsApi.list({ search: barcode, limit: 1 });
        const product = searchResult.data?.[0];
        if (!product) {
          toast.error('Product not found for this barcode');
          return;
        }

        // Step 2: Get product detail with variants
        const detailResult = await productsApi.get(product.id);
        const detail = detailResult.data;
        const variant = detail.variants.find((v) => v.barcode === barcode);
        if (!variant) {
          toast.error('Variant not found for this barcode');
          return;
        }

        // Step 3: Add to cart
        addItem({
          variantId: variant.id,
          productId: detail.id,
          productName: detail.name,
          variantDescription: variant.attributes
            ? Object.values(variant.attributes).join(' / ')
            : '',
          sku: variant.sku,
          barcode: variant.barcode,
          mrp: parseFloat(variant.mrp),
          costPrice: parseFloat(variant.costPrice),
          productDiscountPct: parseFloat(detail.productDiscountPct) || 0,
          gstRate: parseFloat(detail.gstRate || '0'),
          hsnCode: detail.hsnCode,
          version: variant.version,
        });
        toast.success(`Added ${detail.name}`);
      } catch {
        toast.error('Failed to look up barcode');
      } finally {
        setScanBusy(false);
      }
    },
    [scanBusy, addItem],
  );

  // ── Park bill handler ──
  const handleParkBill = useCallback(() => {
    if (items.length === 0) return;

    const billData = JSON.stringify({
      customer: useCartStore.getState().customer,
      newOfflineCustomer: useCartStore.getState().newOfflineCustomer,
      items: useCartStore.getState().items,
      billDiscountPct: useCartStore.getState().billDiscountPct,
      bargainAdjustment: useCartStore.getState().bargainAdjustment,
      finalPriceOverride: useCartStore.getState().finalPriceOverride,
    });

    parkBill.mutate(
      {
        customerId: customer?.id ?? null,
        customerName: customer?.name ?? null,
        customerPhone: customer?.phone ?? null,
        billData,
        itemCount: items.length,
        totalAmount: discountResult?.netPayable ?? 0,
      },
      {
        onSuccess: () => navigate('/pos'),
      },
    );
  }, [items, customer, discountResult, parkBill, navigate]);

  // ── Proceed to pay ──
  const handleProceedToPay = useCallback(() => {
    if (!customer) {
      toast.error('Please select a customer first');
      setCustomerSelectorOpen(true);
      return;
    }
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const maxDiscountPct = settings ? parseFloat(settings.maxDiscountPct) || 30 : 30;
    const effectivePct = discountResult?.effectiveDiscountPct ?? 0;

    if (isDiscountOverCap(effectivePct, maxDiscountPct) && !approvalToken) {
      setPinOpen(true);
      return;
    }

    navigate('/pos/payment');
  }, [customer, items.length, settings, discountResult, approvalToken, navigate]);

  // ── PIN verification ──
  const handlePinSubmit = useCallback(
    (pin: string) => {
      verifyPin.mutate(pin, {
        onSuccess: (res) => {
          setApprovalToken(res.data.approvalToken);
          setPinOpen(false);
          toast.success('Discount approved');
          navigate('/pos/payment');
        },
      });
    },
    [verifyPin, setApprovalToken, navigate],
  );

  // ── Derived ──
  const maxDiscountPct = settings ? parseFloat(settings.maxDiscountPct) || 30 : 30;
  const effectivePct = discountResult?.effectiveDiscountPct ?? 0;
  const needsApproval = isDiscountOverCap(effectivePct, maxDiscountPct) && !approvalToken;
  const hasItems = items.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* ── Customer bar ── */}
      <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User className="size-5" />
        </div>
        {customer ? (
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-semibold text-foreground">
              {customer.name}
            </span>
            <span className="text-xs text-neutral-500">
              {customer.phone}
              {customer.outstandingBalance > 0 && (
                <> &middot; Khata: <span className="text-error-600">{formatINR(customer.outstandingBalance)}</span></>
              )}
            </span>
          </div>
        ) : (
          <span className="flex-1 text-sm text-neutral-400">No customer selected</span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCustomerSelectorOpen(true)}
        >
          {customer ? 'Change' : 'Select'}
        </Button>
      </div>

      {/* ── Barcode input ── */}
      <div className="border-b border-neutral-100 bg-white px-4 py-3">
        <BarcodeInput onSubmit={handleBarcodeScan} placeholder="Scan or type barcode" />
      </div>

      {/* ── Cart items (scrollable) ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {!hasItems ? (
          <EmptyState
            icon={ShoppingCart}
            title="Cart is empty"
            description="Scan a barcode or search to add items"
          />
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <CartItemRow
                key={item.variantId}
                item={item}
                onQuantityChange={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Cart summary + actions (sticky bottom) ── */}
      {hasItems && (
        <div className="shrink-0 border-t border-neutral-200 bg-white">
          {/* Summary */}
          <div className="px-4 pt-3">
            <CartSummary />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 px-4 pb-4 pt-3 pb-safe">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleParkBill}
              disabled={parkBill.isPending}
            >
              <ParkingCircle className="size-4" />
              Park Bill
            </Button>

            {needsApproval ? (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setPinOpen(true)}
              >
                Owner Approval Required
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={handleProceedToPay}
              >
                Proceed to Pay
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Sheets / Overlays ── */}
      <CustomerSelector
        open={customerSelectorOpen}
        onOpenChange={setCustomerSelectorOpen}
        onSelected={setCustomer}
      />

      <DiscountControls
        billDiscountOpen={discountSheetOpen}
        onBillDiscountOpenChange={setDiscountSheetOpen}
        bargainOpen={bargainSheetOpen}
        onBargainOpenChange={setBargainSheetOpen}
      />

      <ConfirmSheet
        open={discardConfirmOpen}
        onOpenChange={setDiscardConfirmOpen}
        title="Discard bill?"
        description="You have items in the cart. Are you sure you want to leave? Your current bill will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        onConfirm={() => {
          clearCart();
          navigate(-1);
        }}
        variant="destructive"
      />

      {pinOpen && (
        <PinKeypad
          onSubmit={handlePinSubmit}
          onCancel={() => setPinOpen(false)}
          title="Enter Owner PIN"
        />
      )}
    </div>
  );
}
