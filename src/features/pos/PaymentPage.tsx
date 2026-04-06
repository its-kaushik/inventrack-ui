import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { SplitPaymentForm } from '@/features/pos/components';

import { useCartStore } from '@/stores/cart.store';
import { useCreateSale } from '@/hooks/use-sales';
import { formatINR } from '@/lib/currency';
import type { CreateSaleRequest, CreateSaleItemInput } from '@/api/sales.api';

// ── Main Page ──

export default function PaymentPage() {
  const navigate = useNavigate();

  // ── Cart store ──
  const customer = useCartStore((s) => s.customer);
  const items = useCartStore((s) => s.items);
  const discountResult = useCartStore((s) => s.discountResult);
  const billDiscountPct = useCartStore((s) => s.billDiscountPct);
  const bargainAdjustment = useCartStore((s) => s.bargainAdjustment);
  const finalPriceOverride = useCartStore((s) => s.finalPriceOverride);
  const approvalToken = useCartStore((s) => s.approvalToken);
  const payments = useCartStore((s) => s.payments);
  const setPayments = useCartStore((s) => s.setPayments);

  const createSale = useCreateSale();

  const netPayable = discountResult?.netPayable ?? 0;

  // ── Build the request items once ──
  const saleItems: CreateSaleItemInput[] = useMemo(
    () =>
      items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        mrp: item.mrp,
        productDiscountPct: item.productDiscountPct,
        costPrice: item.costPrice,
        hsnCode: item.hsnCode,
        gstRate: item.gstRate,
        version: item.version,
      })),
    [items],
  );

  // ── Handle payment completion from SplitPaymentForm ──
  const handlePaymentComplete = useCallback(
    (completedPayments: typeof payments) => {
      setPayments(completedPayments);
      // Trigger sale creation with these payments
      handleCompleteSaleWithPayments(completedPayments);
    },
    [setPayments],
  );

  // ── Validate and submit ──
  const handleCompleteSaleWithPayments = useCallback((finalPayments: typeof payments) => {
    if (!customer) {
      toast.error('No customer selected');
      navigate('/pos');
      return;
    }
    if (items.length === 0) {
      toast.error('Cart is empty');
      navigate('/pos');
      return;
    }
    if (finalPayments.length === 0) {
      toast.error('Please add at least one payment method');
      return;
    }

    // Validate total payments match net payable
    const totalPaid = finalPayments.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(totalPaid - netPayable) > 1) {
      toast.error('Payment total does not match the bill amount');
      return;
    }

    const request: CreateSaleRequest = {
      customerId: customer.id,
      items: saleItems,
      billDiscountPct,
      bargainAdjustment: discountResult?.bargainAdjustment ?? bargainAdjustment,
      finalPrice: finalPriceOverride ?? undefined,
      payments: finalPayments.map((p) => ({ method: p.method, amount: p.amount })),
      approvalToken: approvalToken ?? undefined,
    };

    createSale.mutate(request, {
      onSuccess: (res) => {
        toast.success('Sale completed!');
        navigate(`/pos/receipt/${res.data.id}`);
      },
    });
  }, [
    customer,
    items,
    payments,
    netPayable,
    saleItems,
    billDiscountPct,
    bargainAdjustment,
    finalPriceOverride,
    approvalToken,
    discountResult,
    createSale,
    navigate,
  ]);

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/pos')}
          aria-label="Back to POS"
          className="-ml-2"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="flex-1 text-lg font-bold text-foreground">Payment</h1>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Net payable - large prominent display */}
        <div className="mb-6 rounded-xl bg-primary/5 p-6 text-center">
          <p className="text-sm font-medium text-neutral-500">Net Payable</p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-foreground">
            {formatINR(netPayable)}
          </p>
        </div>

        {/* Customer info */}
        {customer && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-neutral-100 bg-white px-3 py-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {customer.name}
              </span>
              <span className="text-xs text-neutral-500">{customer.phone}</span>
            </div>
          </div>
        )}

        {/* Split payment form */}
        <SplitPaymentForm
          netPayable={netPayable}
          onComplete={handlePaymentComplete}
        />
      </div>

      {/* Bottom status */}
      {createSale.isPending && (
        <div className="shrink-0 border-t border-neutral-200 bg-white px-4 py-4 pb-safe text-center text-sm text-neutral-500">
          Processing sale...
        </div>
      )}
    </div>
  );
}
