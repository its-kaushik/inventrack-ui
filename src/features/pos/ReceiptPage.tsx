import { useRef, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ShoppingCart, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PrintActionSheet } from '@/components/shared';

import { ReceiptPreview } from '@/features/pos/components';

import { useSale } from '@/hooks/use-sales';
import { useCartStore } from '@/stores/cart.store';

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
  const receiptRef = useRef<HTMLDivElement>(null);

  const { data: sale, isLoading } = useSale(saleId!);
  const [printSheetOpen, setPrintSheetOpen] = useState(false);

  // ── Print handler ──
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Download PDF (uses print dialog's Save as PDF) ──
  const handleDownloadPDF = useCallback(() => {
    window.print();
  }, []);

  // ── New bill ──
  const handleNewBill = useCallback(() => {
    clearCart();
    navigate('/pos');
  }, [clearCart, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="-ml-2"
          >
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
        <Button className="mt-6" onClick={() => navigate('/pos')}>
          Back to POS
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 print:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="-ml-2"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="flex-1 text-lg font-bold text-foreground">Receipt</h1>
      </div>

      {/* ── Receipt content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div ref={receiptRef} className="mx-auto max-w-sm">
          <ReceiptPreview sale={sale} />
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="shrink-0 border-t border-neutral-200 bg-white px-4 py-4 pb-safe print:hidden">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => setPrintSheetOpen(true)}
          >
            <Printer className="size-4" />
            Print / Share
          </Button>
          <Button className="flex-1 gap-2" onClick={handleNewBill}>
            <ShoppingCart className="size-4" />
            New Bill
          </Button>
        </div>
      </div>

      <PrintActionSheet
        open={printSheetOpen}
        onOpenChange={setPrintSheetOpen}
        onPrint={handlePrint}
        onDownloadPDF={handleDownloadPDF}
      />
    </div>
  );
}
