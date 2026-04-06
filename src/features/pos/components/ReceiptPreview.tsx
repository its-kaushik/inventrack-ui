'use client';

import { formatINR } from '@/lib/currency';
import type { SaleDetail } from '@/api/sales.api';

// ── Props ──

interface ReceiptPreviewProps {
  sale: SaleDetail;
}

// ── Helpers ──

function fmtDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ', ' + d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function paymentMethodLabel(method: string): string {
  switch (method) {
    case 'cash': return 'Cash';
    case 'upi': return 'UPI';
    case 'card': return 'Card';
    case 'credit': return 'Khata';
    default: return method;
  }
}

const SEPARATOR = '\u2500'.repeat(32);

export function ReceiptPreview({ sale }: ReceiptPreviewProps) {
  const isRegularGst = sale.gstScheme === 'regular';
  const subtotalMrp = parseFloat(sale.subtotalMrp) || 0;
  const billDiscountPct = parseFloat(sale.billDiscountPct) || 0;
  const billDiscountAmount = parseFloat(sale.billDiscountAmount) || 0;
  const bargainAdjustment = parseFloat(sale.bargainAdjustment) || 0;
  const totalCgst = parseFloat(sale.totalCgst) || 0;
  const totalSgst = parseFloat(sale.totalSgst) || 0;
  const totalIgst = parseFloat(sale.totalIgst) || 0;
  const roundOff = parseFloat(sale.roundOff) || 0;
  const netPayable = parseFloat(sale.netPayable) || 0;
  const totalGst = totalCgst + totalSgst + totalIgst;

  return (
    <div
      className="mx-auto w-full max-w-[320px] bg-white p-4 font-mono text-xs leading-relaxed text-neutral-900 print:shadow-none"
      role="article"
      aria-label="Sale receipt"
    >
      {/* Invoice type header */}
      <div className="mb-1 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          {isRegularGst ? 'Tax Invoice' : 'Bill of Supply'}
        </p>
      </div>

      {/* Store Header */}
      <div className="text-center">
        <p className="text-sm font-bold tracking-wide">KAUSHIK VASTRA BHANDAR</p>
        <p className="text-neutral-600">Mathura, Uttar Pradesh</p>
        <p className="text-neutral-600">Phone: 9876543210 | GSTIN: 09XXXXX</p>
      </div>

      <p className="my-2 text-center text-neutral-400">{SEPARATOR}</p>

      {/* Bill info */}
      <div className="space-y-0.5">
        <p>Bill #: {sale.billNumber}</p>
        <p>Date: {fmtDate(sale.createdAt)}</p>
        {sale.customer && (
          <p>Customer: {sale.customer.name} ({sale.customer.phone})</p>
        )}
      </div>

      <p className="my-2 text-center text-neutral-400">{SEPARATOR}</p>

      {/* Items header — different columns for Regular vs Composite */}
      {isRegularGst ? (
        <>
          <div className="flex justify-between font-semibold text-[10px]">
            <span className="flex-1">Item</span>
            <span className="w-6 text-right">Qty</span>
            <span className="w-12 text-right">Price</span>
            <span className="w-10 text-right">GST%</span>
            <span className="w-14 text-right">Total</span>
          </div>
          <div className="mt-1 space-y-1.5">
            {sale.items.map((item, idx) => {
              const gstRate = parseFloat(item.gstRate) || 0;
              const cgst = parseFloat(item.cgstAmount) || 0;
              const sgst = parseFloat(item.sgstAmount) || 0;
              return (
                <div key={idx}>
                  <div className="flex justify-between text-[10px]">
                    <span className="flex-1 truncate pr-1">{item.productName}</span>
                    <span className="w-6 text-right">{item.quantity}</span>
                    <span className="w-12 text-right">{formatINR(item.unitPrice)}</span>
                    <span className="w-10 text-right">{gstRate}%</span>
                    <span className="w-14 text-right">{formatINR(item.lineTotal)}</span>
                  </div>
                  {item.variantDescription && (
                    <p className="pl-2 text-[9px] text-neutral-500">{item.variantDescription}</p>
                  )}
                  {(cgst > 0 || sgst > 0) && (
                    <p className="pl-2 text-[9px] text-neutral-400">
                      CGST: {formatINR(cgst)} + SGST: {formatINR(sgst)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between font-semibold">
            <span className="flex-1">Item</span>
            <span className="w-8 text-right">Qty</span>
            <span className="w-16 text-right">MRP</span>
            <span className="w-16 text-right">Total</span>
          </div>
          <div className="mt-1 space-y-1.5">
            {sale.items.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between">
                  <span className="flex-1 truncate pr-1">{item.productName}</span>
                  <span className="w-8 text-right">{item.quantity}</span>
                  <span className="w-16 text-right">{formatINR(item.mrp)}</span>
                  <span className="w-16 text-right">{formatINR(item.lineTotal)}</span>
                </div>
                {item.variantDescription && (
                  <p className="pl-2 text-neutral-500">{item.variantDescription}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <p className="my-2 text-center text-neutral-400">{SEPARATOR}</p>

      {/* Totals */}
      <div className="space-y-0.5">
        <ReceiptRow label="Subtotal (MRP):" value={formatINR(subtotalMrp)} />

        {billDiscountAmount > 0 && (
          <ReceiptRow
            label={`Bill Discount (${billDiscountPct}%):`}
            value={`-${formatINR(billDiscountAmount)}`}
          />
        )}

        {bargainAdjustment > 0 && (
          <ReceiptRow label="Bargain Adjustment:" value={`-${formatINR(bargainAdjustment)}`} />
        )}

        {/* GST summary — Regular scheme only */}
        {isRegularGst && totalGst > 0 && (
          <>
            {totalCgst > 0 && <ReceiptRow label="CGST:" value={formatINR(totalCgst)} />}
            {totalSgst > 0 && <ReceiptRow label="SGST:" value={formatINR(totalSgst)} />}
            {totalIgst > 0 && <ReceiptRow label="IGST:" value={formatINR(totalIgst)} />}
          </>
        )}

        {roundOff !== 0 && (
          <ReceiptRow
            label="Round Off:"
            value={`${roundOff > 0 ? '+' : '-'}${formatINR(Math.abs(roundOff))}`}
          />
        )}

        <div className="flex justify-end">
          <span className="text-neutral-400">{'\u2500'.repeat(16)}</span>
        </div>

        <div className="flex justify-between text-sm font-bold">
          <span>NET PAYABLE:</span>
          <span>{formatINR(netPayable)}</span>
        </div>

        <div className="flex justify-end">
          <span className="text-neutral-400">{'\u2500'.repeat(16)}</span>
        </div>
      </div>

      {/* Payments */}
      {sale.payments.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {sale.payments.map((payment, idx) => (
            <ReceiptRow
              key={idx}
              label={`Payment: ${paymentMethodLabel(payment.paymentMethod)}`}
              value={formatINR(payment.amount)}
            />
          ))}
        </div>
      )}

      <p className="my-2 text-center text-neutral-400">{SEPARATOR}</p>

      {/* Footer — different for Composite vs Regular */}
      <div className="space-y-1 text-center text-neutral-500">
        {!isRegularGst && (
          <p className="text-[10px]">
            &quot;Composition taxable person, not eligible to collect tax on supplies&quot;
          </p>
        )}
        {isRegularGst && (
          <p className="text-[10px]">
            GST included in prices as applicable
          </p>
        )}
        <p>Return policy: 7 days with bill</p>
        <p className="mt-2 font-medium text-neutral-700">
          Thank you for shopping!
        </p>
      </div>
    </div>
  );
}

// ── Internal helper ──

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
