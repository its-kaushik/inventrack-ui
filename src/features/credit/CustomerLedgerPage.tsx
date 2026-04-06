import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Phone,
  IndianRupee,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { LedgerTable, CurrencyInput } from '@/components/shared';
import type { LedgerEntry as LedgerTableEntry } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useCustomer,
  useCustomerLedger,
  useRecordCustomerPayment,
} from '@/hooks/use-customers';
import { formatINR, parseAmount } from '@/lib/currency';
import { formatDate } from '@/lib/format-date';
import { cn } from '@/lib/cn';

// ── Constants ──

const LEDGER_PAGE_LIMIT = 20;

// ── Loading skeleton ──

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 pb-8 desktop:px-6" aria-busy="true">
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <Skeleton className="h-5 w-40" />
        <div className="mt-3 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-36" />
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

// ── Record Payment Dialog ──

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
}

function RecordPaymentDialog({ open, onOpenChange, customerId }: RecordPaymentDialogProps) {
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<string>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState('');

  const recordPayment = useRecordCustomerPayment(customerId);

  const handleSubmit = () => {
    if (amount === '' || amount <= 0) return;

    recordPayment.mutate(
      {
        amount,
        paymentMode: paymentMode as 'cash' | 'upi' | 'bank_transfer' | 'cheque',
        referenceNumber: referenceNumber.trim() || null,
        notes: notes.trim() || null,
        paymentDate: paymentDate || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setAmount('');
          setPaymentMode('cash');
          setReferenceNumber('');
          setNotes('');
          setPaymentDate('');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-amount">Amount</Label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              placeholder="Enter amount"
            />
          </div>

          {/* Payment Mode */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-mode">Payment Mode</Label>
            <Select value={paymentMode} onValueChange={(val) => setPaymentMode(val ?? 'cash')}>
              <SelectTrigger className="w-full" id="payment-mode">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reference Number */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-ref">Reference Number</Label>
            <Input
              id="payment-ref"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. UPI ID, cheque no."
            />
          </div>

          {/* Payment Date */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-date">Payment Date</Label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-notes">Notes</Label>
            <Textarea
              id="payment-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={amount === '' || amount <= 0 || recordPayment.isPending}
          >
            {recordPayment.isPending ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──

export default function CustomerLedgerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: customer, isLoading } = useCustomer(id!);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(1);

  const { data: ledgerResponse, isLoading: ledgerLoading } = useCustomerLedger(id!, {
    page: ledgerPage,
    limit: LEDGER_PAGE_LIMIT,
  });

  const ledgerEntries = ledgerResponse?.data ?? [];
  const ledgerMeta = ledgerResponse?.meta ?? {
    total: 0,
    page: 1,
    limit: LEDGER_PAGE_LIMIT,
    totalPages: 1,
  };

  // Transform API ledger entries to LedgerTable format
  const ledgerTableEntries: LedgerTableEntry[] = ledgerEntries.map((entry) => ({
    date: formatDate(entry.createdAt),
    description: entry.referenceNumber
      ? `${entry.transactionType} - ${entry.referenceNumber}`
      : entry.transactionType,
    debit: entry.debit ? parseFloat(entry.debit) : undefined,
    credit: entry.credit ? parseFloat(entry.credit) : undefined,
    balance: parseFloat(entry.balance),
  }));

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Loading..." showBack />
        <DetailSkeleton />
      </div>
    );
  }

  if (!customer) {
    return (
      <div>
        <PageHeader title="Customer Ledger" showBack />
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <Users className="size-12 text-neutral-300" />
          <h3 className="mt-4 font-semibold text-neutral-900">Customer not found</h3>
          <p className="mt-1 text-sm text-neutral-500">
            This customer may have been deleted or you don&apos;t have access.
          </p>
          <Button className="mt-6" onClick={() => navigate('/credit/customers')}>
            Back to Customer Khata
          </Button>
        </div>
      </div>
    );
  }

  const outstanding = parseAmount(customer.outstandingBalance);

  return (
    <div>
      <PageHeader title={customer.name} showBack />

      <div className="flex flex-col gap-6 px-4 pb-8 desktop:px-6">
        {/* Header card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-foreground">
                  {customer.name}
                </h2>
                {customer.phone && (
                  <a
                    href={`tel:${customer.phone}`}
                    className="mt-1 flex items-center gap-1.5 text-sm text-primary-600"
                  >
                    <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                    {customer.phone}
                  </a>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p
                  className={cn(
                    'text-2xl font-bold tabular-nums',
                    outstanding > 0 ? 'text-error-600' : 'text-foreground',
                  )}
                >
                  {formatINR(outstanding)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Record Payment button */}
        <Button
          className="w-full"
          onClick={() => setPaymentDialogOpen(true)}
        >
          <IndianRupee className="size-4" data-icon="inline-start" />
          Record Payment
        </Button>

        {/* Ledger */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
            <Wallet className="size-4" aria-hidden="true" />
            Ledger
          </h3>

          {ledgerLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : ledgerTableEntries.length === 0 ? (
            <div className="rounded-xl bg-card p-8 text-center ring-1 ring-foreground/10">
              <Clock className="mx-auto size-8 text-neutral-300" />
              <p className="mt-2 text-sm text-muted-foreground">
                No ledger entries yet
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-card ring-1 ring-foreground/10">
                <LedgerTable entries={ledgerTableEntries} />
              </div>

              {/* Pagination */}
              {ledgerMeta.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                    disabled={ledgerMeta.page <= 1}
                  >
                    <ChevronLeft className="size-4" data-icon="inline-start" />
                    Previous
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Page {ledgerMeta.page} of {ledgerMeta.totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setLedgerPage((p) => Math.min(ledgerMeta.totalPages, p + 1))
                    }
                    disabled={ledgerMeta.page >= ledgerMeta.totalPages}
                  >
                    Next
                    <ChevronRight className="size-4" data-icon="inline-end" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        customerId={id!}
      />
    </div>
  );
}
