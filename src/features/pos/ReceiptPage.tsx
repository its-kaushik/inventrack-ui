import { useRef, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ShoppingCart, ArrowLeft, Ban } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PrintActionSheet, StatusBadge, PinKeypad } from '@/components/shared';

import { ReceiptPreview } from '@/features/pos/components';

import { useSale, useVoidSale } from '@/hooks/use-sales';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/api/auth.api';
import { toast } from 'sonner';

// ── Loading skeleton ──

function ReceiptSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 py-6" aria-busy="true">
      <div className="mx-auto w-full max-w-sm rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
        <Skeleton className="mx-auto h-6 w-48" />
        <Skeleton className="mx-auto mt-2 h-4 w-32" />
        <Skeleton className="mx-auto mt-6 h-px w-full" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="mx-auto mt-6 h-px w-full" />
        <div className="mt-4 flex justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function ReceiptPage() {
  const { saleId } = useParams<{ saleId: string }>();
  const navigate = useNavigate();
  const clearCart = useCartStore((s) => s.clearCart);
  const { user } = useAuthStore();
  const receiptRef = useRef<HTMLDivElement>(null);

  const { data: sale, isLoading } = useSale(saleId!);
  const voidSale = useVoidSale();

  const [printSheetOpen, setPrintSheetOpen] = useState(false);

  // Void flow state
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [pinOpen, setPinOpen] = useState(false);
  const [approvalToken, setApprovalToken] = useState<string | null>(null);

  const isOwner = user?.role === 'owner' || user?.role === 'super_admin';
  const canVoid = isOwner || user?.role === 'manager';
  const isCancelled = sale?.status === 'cancelled';
  const isReturned = sale?.status === 'returned' || sale?.status === 'partially_returned';

  // ── Handlers ──

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPDF = useCallback(() => {
    window.print();
  }, []);

  const handleNewBill = useCallback(() => {
    clearCart();
    navigate('/pos');
  }, [clearCart, navigate]);

  const handleVoidStart = () => {
    setVoidReason('');
    setApprovalToken(null);
    setVoidDialogOpen(true);
  };

  const handleVoidProceed = () => {
    if (!voidReason.trim()) {
      toast.error('Please enter a reason for voiding');
      return;
    }
    // Owner can void directly, Manager needs PIN
    if (isOwner) {
      // Owner doesn't need PIN — use a self-approval token
      setPinOpen(true);
    } else {
      setPinOpen(true);
    }
  };

  const handlePinSubmit = async (pin: string) => {
    try {
      const res = await authApi.verifyPin(pin);
      const token = res.data.approvalToken;
      setApprovalToken(token);
      setPinOpen(false);

      // Now void the bill
      voidSale.mutate(
        { id: saleId!, reason: voidReason.trim(), approvalToken: token },
        {
          onSuccess: () => {
            setVoidDialogOpen(false);
            toast.success('Bill voided successfully');
          },
        },
      );
    } catch {
      toast.error('Invalid PIN');
    }
  };

  // ── Loading ──

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back" className="-ml-2">
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="flex-1 text-lg font-bold text-foreground">Receipt</h1>
        </div>
        <ReceiptSkeleton />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <ShoppingCart className="size-12 text-neutral-300" />
        <h3 className="mt-4 font-semibold text-neutral-900">Sale not found</h3>
        <p className="mt-1 text-sm text-neutral-500">
          This sale may have been deleted or you don&apos;t have access.
        </p>
        <Button className="mt-6" onClick={() => navigate('/pos')}>Back to POS</Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 print:hidden">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back" className="-ml-2">
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="flex-1 text-lg font-bold text-foreground">Receipt</h1>
        {isCancelled && <StatusBadge status="red" label="Voided" />}
        {isReturned && <StatusBadge status="amber" label="Returned" />}
      </div>

      {/* ── Voided banner ── */}
      {isCancelled && (
        <div className="bg-error-50 px-4 py-2 text-center text-sm font-medium text-error-700 print:hidden">
          This bill has been voided and is excluded from reports.
        </div>
      )}

      {/* ── Receipt content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div ref={receiptRef} className="mx-auto max-w-sm">
          <ReceiptPreview sale={sale} />
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="shrink-0 border-t border-neutral-200 bg-white px-4 py-4 pb-safe print:hidden">
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => setPrintSheetOpen(true)}>
            <Printer className="size-4" />
            Print / Share
          </Button>
          {!isCancelled && !isReturned && (
            <Button className="flex-1 gap-2" onClick={handleNewBill}>
              <ShoppingCart className="size-4" />
              New Bill
            </Button>
          )}
        </div>

        {/* Void button — only for active bills, owner/manager */}
        {canVoid && !isCancelled && !isReturned && sale.status === 'completed' && (
          <Button
            variant="outline"
            className="mt-3 w-full gap-2 border-error-200 text-error-600 hover:bg-error-50"
            onClick={handleVoidStart}
            disabled={voidSale.isPending}
          >
            <Ban className="size-4" />
            Void Bill
          </Button>
        )}
      </div>

      {/* ── Print Sheet ── */}
      <PrintActionSheet
        open={printSheetOpen}
        onOpenChange={setPrintSheetOpen}
        onPrint={handlePrint}
        onDownloadPDF={handleDownloadPDF}
      />

      {/* ── Void Dialog ── */}
      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-error-600">Void Bill #{sale.billNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-neutral-600">
              This will reverse all inventory changes and credit entries for this bill.
              The bill will be marked as cancelled and excluded from reports.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="void-reason">
                Reason for voiding <span className="text-error-500">*</span>
              </Label>
              <Textarea
                id="void-reason"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="e.g., Wrong customer, duplicate bill, billing error"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoidProceed}
              disabled={!voidReason.trim() || voidSale.isPending}
            >
              {voidSale.isPending ? 'Voiding...' : 'Proceed — Enter PIN'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── PIN Keypad for void approval ── */}
      {pinOpen && (
        <PinKeypad
          onSubmit={handlePinSubmit}
          onCancel={() => setPinOpen(false)}
          title="Owner PIN Required"
        />
      )}
    </div>
  );
}
