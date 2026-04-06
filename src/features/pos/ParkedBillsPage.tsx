import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParkingCircle, RotateCcw, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout';
import { ConfirmSheet, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useParkedBills, useRecallBill, useDeleteParkedBill } from '@/hooks/use-sales';
import { useCartStore } from '@/stores/cart.store';
import { formatINR } from '@/lib/currency';
import { formatDateTime } from '@/lib/format-date';

// ── Helpers ──

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

// ── Skeleton ──

function ParkedBillSkeleton() {
  return (
    <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="mt-2 h-3 w-48" />
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  );
}

// ── Main Page ──

export default function ParkedBillsPage() {
  const navigate = useNavigate();

  // ── Cart store actions ──
  const clearCart = useCartStore((s) => s.clearCart);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const addItem = useCartStore((s) => s.addItem);
  const setBillDiscountPct = useCartStore((s) => s.setBillDiscountPct);
  const setBargainAdjustment = useCartStore((s) => s.setBargainAdjustment);
  const setFinalPriceOverride = useCartStore((s) => s.setFinalPriceOverride);
  const cartItems = useCartStore((s) => s.items);

  // ── Hooks ──
  const { data: parkedBills, isLoading } = useParkedBills();
  const recallBill = useRecallBill();
  const deleteParkedBill = useDeleteParkedBill();

  // ── Local state ──
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [recallingId, setRecallingId] = useState<string | null>(null);

  // ── Recall handler ──
  const handleRecall = useCallback(
    (bill: { id: string; billData: string }) => {
      // Warn if cart has items
      if (cartItems.length > 0) {
        toast.error('Please clear or park your current cart first');
        return;
      }

      setRecallingId(bill.id);

      recallBill.mutate(bill.id, {
        onSuccess: () => {
          try {
            // Parse the stored bill data and restore cart
            const data = JSON.parse(bill.billData);

            clearCart();

            // Restore customer
            if (data.customer) {
              setCustomer(data.customer);
            }

            // Restore items
            if (data.items && Array.isArray(data.items)) {
              for (const item of data.items) {
                const { quantity, ...rest } = item;
                addItem(rest);
                // If quantity > 1, update it (addItem sets qty to 1)
                if (quantity > 1) {
                  useCartStore.getState().updateQuantity(rest.variantId, quantity);
                }
              }
            }

            // Restore discounts
            if (typeof data.billDiscountPct === 'number') {
              setBillDiscountPct(data.billDiscountPct);
            }
            if (typeof data.bargainAdjustment === 'number') {
              setBargainAdjustment(data.bargainAdjustment);
            }
            if (data.finalPriceOverride != null) {
              setFinalPriceOverride(data.finalPriceOverride);
            }

            toast.success('Bill recalled');
            navigate('/pos');
          } catch {
            toast.error('Failed to parse parked bill data');
          }
        },
        onSettled: () => setRecallingId(null),
      });
    },
    [
      cartItems.length,
      recallBill,
      clearCart,
      setCustomer,
      addItem,
      setBillDiscountPct,
      setBargainAdjustment,
      setFinalPriceOverride,
      navigate,
    ],
  );

  // ── Delete handler ──
  const handleDeleteConfirm = useCallback(() => {
    if (!pendingDeleteId) return;
    deleteParkedBill.mutate(pendingDeleteId, {
      onSuccess: () => {
        setPendingDeleteId(null);
      },
    });
  }, [pendingDeleteId, deleteParkedBill]);

  const openDeleteConfirm = (id: string) => {
    setPendingDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const bills = parkedBills ?? [];
  const isEmpty = !isLoading && bills.length === 0;

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader title="Parked Bills" showBack />

      {/* ── Content ── */}
      <div className="flex-1 px-4 pb-6 desktop:px-6">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ParkedBillSkeleton key={i} />
            ))}
          </div>
        ) : isEmpty ? (
          <EmptyState
            icon={ParkingCircle}
            title="No parked bills"
            description="Bills you park during billing will appear here."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {bill.customerName || 'Walk-in Customer'}
                    </span>
                    {bill.customerPhone && (
                      <span className="text-xs text-neutral-500">
                        {bill.customerPhone}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                    {formatINR(bill.totalAmount)}
                  </span>
                </div>

                {/* Meta row */}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {timeAgo(bill.parkedAt)}
                  </span>
                  <span>{bill.itemCount} item{bill.itemCount !== 1 ? 's' : ''}</span>
                  <span>by {bill.createdByName}</span>
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleRecall(bill)}
                    disabled={recallBill.isPending && recallingId === bill.id}
                  >
                    <RotateCcw className="size-3.5" />
                    {recallBill.isPending && recallingId === bill.id
                      ? 'Recalling...'
                      : 'Recall'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-error-600 hover:bg-error-50 hover:text-error-700"
                    onClick={() => openDeleteConfirm(bill.id)}
                    disabled={deleteParkedBill.isPending}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}

            {/* Footer note */}
            <p className="mt-2 text-center text-xs text-neutral-400">
              Parked bills expire after 24 hours
            </p>
          </div>
        )}
      </div>

      {/* Delete confirm sheet */}
      <ConfirmSheet
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete parked bill?"
        description="This action cannot be undone. The parked bill will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </div>
  );
}
