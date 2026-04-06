import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IndianRupee, Phone, Building2 } from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { LedgerTable, CurrencyInput, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import { useSupplier, useSupplierLedger, useRecordSupplierPayment } from '@/hooks/use-suppliers';
import { formatINR, parseAmount } from '@/lib/currency';
import { formatDate } from '@/lib/format-date';
import { cn } from '@/lib/cn';
import type { LedgerEntry } from '@/api/suppliers.api';

export default function SupplierLedgerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const supplierId = id ?? '';

  const { data: supplier, isLoading: supplierLoading } = useSupplier(supplierId);
  const [page, setPage] = useState(1);
  const { data: ledgerData, isLoading: ledgerLoading } = useSupplierLedger(supplierId, { page, limit: 20 });
  const recordPayment = useRecordSupplierPayment(supplierId);

  // Payment dialog state
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');

  // Transform ledger entries for LedgerTable
  const ledgerEntries = useMemo(() => {
    if (!ledgerData?.data) return [];
    return ledgerData.data.map((entry: LedgerEntry) => ({
      date: entry.createdAt,
      description: [entry.transactionType, entry.referenceNumber].filter(Boolean).join(' · '),
      debit: entry.debit ? parseAmount(entry.debit) : undefined,
      credit: entry.credit ? parseAmount(entry.credit) : undefined,
      balance: parseAmount(entry.balance),
    }));
  }, [ledgerData?.data]);

  const handleRecordPayment = () => {
    if (!paymentAmount || paymentAmount <= 0) return;
    recordPayment.mutate(
      {
        amount: paymentAmount,
        paymentMode: paymentMode as 'cash' | 'upi' | 'bank_transfer' | 'cheque',
        referenceNumber: paymentRef || null,
        notes: paymentNotes || null,
        paymentDate,
      },
      {
        onSuccess: () => {
          setPaymentOpen(false);
          setPaymentAmount('');
          setPaymentRef('');
          setPaymentNotes('');
        },
      },
    );
  };

  const outstanding = parseAmount(supplier?.outstandingBalance);
  const totalPages = ledgerData?.meta?.totalPages ?? 1;

  // Loading
  if (supplierLoading) {
    return (
      <div className="space-y-4 p-4 desktop:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-card" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="p-4">
        <PageHeader title="Supplier Not Found" showBack />
        <EmptyState icon={Building2} title="Supplier not found" description="This supplier may have been removed." />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 desktop:p-6">
      <PageHeader title={supplier.name} showBack onBack={() => navigate('/credit')} />

      {/* Header card */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">{supplier.name}</h2>
              {supplier.phone && (
                <a href={`tel:${supplier.phone}`} className="mt-1 flex items-center gap-1 text-sm text-primary-600">
                  <Phone className="size-3.5" /> {supplier.phone}
                </a>
              )}
              {supplier.contactPerson && (
                <p className="mt-1 text-sm text-neutral-500">{supplier.contactPerson}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500">Outstanding</p>
              <p className={cn('text-2xl font-bold', outstanding > 0 ? 'text-error-600' : 'text-success-600')}>
                {formatINR(outstanding)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={() => setPaymentOpen(true)} className="w-full touch-target desktop:w-auto">
              <IndianRupee className="size-4" data-icon="inline-start" />
              Record Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ledger */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-neutral-800">Transaction Ledger</h3>
        {ledgerLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : ledgerEntries.length === 0 ? (
          <EmptyState icon={Building2} title="No transactions" description="No ledger entries yet for this supplier." />
        ) : (
          <>
            <LedgerTable entries={ledgerEntries} />
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-neutral-500">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment to {supplier.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="sp-amount">Amount</Label>
              <CurrencyInput
                value={paymentAmount}
                onChange={setPaymentAmount}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-mode">Payment Mode</Label>
              <Select value={paymentMode} onValueChange={(val) => setPaymentMode(val ?? 'cash')}>
                <SelectTrigger className="w-full" id="sp-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-ref">Reference Number</Label>
              <Input id="sp-ref" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-date">Date</Label>
              <Input id="sp-date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-notes">Notes</Label>
              <Textarea id="sp-notes" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Optional" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={!paymentAmount || paymentAmount <= 0 || recordPayment.isPending}>
              {recordPayment.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
