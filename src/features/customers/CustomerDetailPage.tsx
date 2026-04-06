import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  ShoppingCart,
  Hash,
  Pencil,
  Wallet,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { MetricCard, LedgerTable, CurrencyInput } from '@/components/shared';
import type { LedgerEntry as LedgerTableEntry } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { formatINR } from '@/lib/currency';
import { formatDate } from '@/lib/format-date';
import { cn } from '@/lib/cn';

// ── Constants ──

const LEDGER_PAGE_LIMIT = 20;

// ── Loading skeleton ──

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 pb-8 desktop:px-6" aria-busy="true">
      {/* Profile card skeleton */}
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <Skeleton className="h-5 w-40" />
        <div className="mt-3 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      {/* Khata skeleton */}
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="mt-2 h-4 w-24" />
        <Skeleton className="mt-4 h-10 w-full" />
      </div>

      {/* Tabs skeleton */}
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 w-full rounded-xl" />
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
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
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

export default function CustomerDetailPage() {
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
  const ledgerMeta = ledgerResponse?.meta ?? { total: 0, page: 1, limit: LEDGER_PAGE_LIMIT, totalPages: 1 };

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
        <PageHeader title="Customer" showBack />
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <Users className="size-12 text-neutral-300" />
          <h3 className="mt-4 font-semibold text-neutral-900">
            Customer not found
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            This customer may have been deleted or you don&apos;t have access.
          </p>
          <Button className="mt-6" onClick={() => navigate('/customers')}>
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  const outstanding = parseFloat(customer.outstandingBalance || '0');
  const totalSpend = parseFloat(customer.totalSpend || '0');
  const avgTransaction =
    customer.visitCount > 0 ? totalSpend / customer.visitCount : 0;

  return (
    <div>
      <PageHeader title={customer.name} showBack />

      <div className="flex flex-col gap-6 px-4 pb-8 desktop:px-6">
        {/* Profile card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-3.5" aria-hidden="true" />
                Name
              </dt>
              <dd className="font-medium text-foreground">{customer.name}</dd>

              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="size-3.5" aria-hidden="true" />
                Phone
              </dt>
              <dd>
                <a
                  href={`tel:+91${customer.phone}`}
                  className="font-medium text-primary-600 underline-offset-2 hover:underline"
                >
                  {customer.phone}
                </a>
              </dd>

              {customer.email && (
                <>
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="size-3.5" aria-hidden="true" />
                    Email
                  </dt>
                  <dd className="font-medium text-foreground">{customer.email}</dd>
                </>
              )}

              {customer.address && (
                <>
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    Address
                  </dt>
                  <dd className="font-medium text-foreground">{customer.address}</dd>
                </>
              )}

              {customer.gstin && (
                <>
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Hash className="size-3.5" aria-hidden="true" />
                    GSTIN
                  </dt>
                  <dd className="font-mono font-medium text-foreground">{customer.gstin}</dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Stats row: 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Total Spend"
            value={formatINR(totalSpend)}
          />
          <MetricCard
            label="Visits"
            value={customer.visitCount}
          />
          <MetricCard
            label="Avg Transaction"
            value={customer.visitCount > 0 ? formatINR(avgTransaction) : '\u2014'}
          />
          <MetricCard
            label="Last Visit"
            value={customer.lastVisitAt ? formatDate(customer.lastVisitAt) : 'Never'}
          />
        </div>

        {/* Khata (Credit) card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="size-4" aria-hidden="true" />
              Khata (Credit)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                'text-3xl font-bold tabular-nums',
                outstanding > 0 ? 'text-error-600' : 'text-foreground',
              )}
            >
              {formatINR(outstanding)}
            </p>
            {outstanding > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">Outstanding balance</p>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                onClick={() => setPaymentDialogOpen(true)}
              >
                <IndianRupee className="size-4" data-icon="inline-start" />
                Record Payment
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs: Purchases | Ledger */}
        <Tabs defaultValue="purchases">
          <TabsList>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="ledger">Ledger</TabsTrigger>
          </TabsList>

          {/* Purchases tab - placeholder */}
          <TabsContent value="purchases">
            <div className="mt-2 rounded-xl bg-card p-8 text-center ring-1 ring-foreground/10">
              <ShoppingCart className="mx-auto size-8 text-neutral-300" />
              <p className="mt-2 text-sm text-muted-foreground">
                Purchase history will be available after POS is built (F10)
              </p>
            </div>
          </TabsContent>

          {/* Ledger tab */}
          <TabsContent value="ledger">
            <div className="mt-2">
              {ledgerLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : ledgerTableEntries.length === 0 ? (
                <div className="rounded-xl bg-card p-8 text-center ring-1 ring-foreground/10">
                  <TrendingUp className="mx-auto size-8 text-neutral-300" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No ledger entries yet
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl bg-card ring-1 ring-foreground/10">
                    <LedgerTable entries={ledgerTableEntries} />
                  </div>

                  {/* Ledger pagination */}
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
                        onClick={() => setLedgerPage((p) => Math.min(ledgerMeta.totalPages, p + 1))}
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
          </TabsContent>
        </Tabs>

        {/* Action buttons */}
        <section className="flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => navigate(`/customers/${customer.id}/edit`)}
          >
            <Pencil className="size-4" />
            Edit Customer
          </Button>
        </section>
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
