import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  IndianRupee,
  CreditCard,
  Pencil,
  Trash2,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { ConfirmSheet, StatusBadge, LedgerTable, CurrencyInput } from '@/components/shared';
import type { LedgerEntry as LedgerTableEntry } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  useSupplier,
  useDeactivateSupplier,
  useSupplierLedger,
  useRecordSupplierPayment,
} from '@/hooks/use-suppliers';
import { useAuthStore } from '@/stores/auth.store';
import { formatINR } from '@/lib/currency';
import { formatDate } from '@/lib/format-date';
import { cn } from '@/lib/cn';

// ── Constants ──

const LEDGER_PAGE_LIMIT = 20;

const PAYMENT_TERMS_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  net_15: 'Net 15 Days',
  net_30: 'Net 30 Days',
  net_60: 'Net 60 Days',
  advance: 'Advance',
};

const PAYMENT_MODE_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
};

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

      {/* Credit card skeleton */}
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
  supplierId: string;
}

function RecordPaymentDialog({ open, onOpenChange, supplierId }: RecordPaymentDialogProps) {
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<string>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState('');

  const recordPayment = useRecordSupplierPayment(supplierId);

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

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'owner' || user?.role === 'manager';

  const { data: supplier, isLoading } = useSupplier(id!);
  const deactivateMutation = useDeactivateSupplier();

  const [deactivateSheetOpen, setDeactivateSheetOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(1);

  const { data: ledgerResponse, isLoading: ledgerLoading } = useSupplierLedger(id!, {
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

  // ── Handlers ──

  const handleDeactivate = () => {
    if (!supplier) return;
    deactivateMutation.mutate(supplier.id, {
      onSuccess: () => {
        setDeactivateSheetOpen(false);
        navigate('/suppliers');
      },
    });
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Loading..." showBack />
        <DetailSkeleton />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div>
        <PageHeader title="Supplier" showBack />
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <Building2 className="size-12 text-neutral-300" />
          <h3 className="mt-4 font-semibold text-neutral-900">
            Supplier not found
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            This supplier may have been deleted or you don&apos;t have access.
          </p>
          <Button className="mt-6" onClick={() => navigate('/suppliers')}>
            Back to Suppliers
          </Button>
        </div>
      </div>
    );
  }

  const outstanding = parseFloat(supplier.outstandingBalance || '0');

  return (
    <div>
      <PageHeader title={supplier.name} showBack />

      <div className="flex flex-col gap-6 px-4 pb-8 desktop:px-6">
        {/* Inactive banner */}
        {!supplier.isActive && (
          <div className="flex items-center gap-2 rounded-lg bg-error-50 px-4 py-3 text-sm font-medium text-error-700">
            <Building2 className="size-4 shrink-0" aria-hidden="true" />
            This supplier is inactive
          </div>
        )}

        {/* Profile card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Profile</span>
              <StatusBadge
                status={supplier.isActive ? 'green' : 'red'}
                label={supplier.isActive ? 'Active' : 'Inactive'}
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Building2 className="size-3.5" aria-hidden="true" />
                Name
              </dt>
              <dd className="font-medium text-foreground">{supplier.name}</dd>

              {supplier.contactPerson && (
                <>
                  <dt className="text-muted-foreground">Contact Person</dt>
                  <dd className="font-medium text-foreground">{supplier.contactPerson}</dd>
                </>
              )}

              {supplier.phone && (
                <>
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="size-3.5" aria-hidden="true" />
                    Phone
                  </dt>
                  <dd>
                    <a
                      href={`tel:${supplier.phone}`}
                      className="font-medium text-primary-600 underline-offset-2 hover:underline"
                    >
                      {supplier.phone}
                    </a>
                  </dd>
                </>
              )}

              {supplier.email && (
                <>
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="size-3.5" aria-hidden="true" />
                    Email
                  </dt>
                  <dd className="font-medium text-foreground">{supplier.email}</dd>
                </>
              )}

              {supplier.address && (
                <>
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    Address
                  </dt>
                  <dd className="font-medium text-foreground">{supplier.address}</dd>
                </>
              )}

              <>
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <CreditCard className="size-3.5" aria-hidden="true" />
                  Payment Terms
                </dt>
                <dd className="font-medium text-foreground">
                  {PAYMENT_TERMS_LABELS[supplier.paymentTerms] ?? supplier.paymentTerms}
                </dd>
              </>
            </dl>
          </CardContent>
        </Card>

        {/* Credit summary card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="size-4" aria-hidden="true" />
              Outstanding Balance
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
            <Button
              className="mt-4 w-full"
              onClick={() => setPaymentDialogOpen(true)}
            >
              <IndianRupee className="size-4" data-icon="inline-start" />
              Record Payment
            </Button>
          </CardContent>
        </Card>

        {/* Tabs: Ledger | Info */}
        <Tabs defaultValue="ledger">
          <TabsList>
            <TabsTrigger value="ledger">Ledger</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

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
                  <FileText className="mx-auto size-8 text-neutral-300" />
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

          {/* Info tab */}
          <TabsContent value="info">
            <div className="mt-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium text-foreground">{supplier.name}</dd>

                <dt className="text-muted-foreground">Contact Person</dt>
                <dd className="font-medium text-foreground">
                  {supplier.contactPerson || '\u2014'}
                </dd>

                <dt className="text-muted-foreground">Phone</dt>
                <dd className="font-medium text-foreground">
                  {supplier.phone ? (
                    <a
                      href={`tel:${supplier.phone}`}
                      className="text-primary-600 underline-offset-2 hover:underline"
                    >
                      {supplier.phone}
                    </a>
                  ) : (
                    '\u2014'
                  )}
                </dd>

                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium text-foreground">
                  {supplier.email || '\u2014'}
                </dd>

                <dt className="text-muted-foreground">Address</dt>
                <dd className="font-medium text-foreground">
                  {supplier.address || '\u2014'}
                </dd>

                <Separator className="col-span-2 my-1" />

                <dt className="text-muted-foreground">GSTIN</dt>
                <dd className="font-mono font-medium text-foreground">
                  {supplier.gstin || '\u2014'}
                </dd>

                <dt className="text-muted-foreground">PAN</dt>
                <dd className="font-mono font-medium text-foreground">
                  {supplier.pan || '\u2014'}
                </dd>

                <Separator className="col-span-2 my-1" />

                <dt className="text-muted-foreground">Payment Terms</dt>
                <dd className="font-medium text-foreground">
                  {PAYMENT_TERMS_LABELS[supplier.paymentTerms] ?? supplier.paymentTerms}
                </dd>

                <dt className="text-muted-foreground">Outstanding Balance</dt>
                <dd
                  className={cn(
                    'font-medium tabular-nums',
                    outstanding > 0 ? 'text-error-600' : 'text-foreground',
                  )}
                >
                  {formatINR(outstanding)}
                </dd>

                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <StatusBadge
                    status={supplier.isActive ? 'green' : 'red'}
                    label={supplier.isActive ? 'Active' : 'Inactive'}
                  />
                </dd>
              </dl>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action buttons */}
        <section className="flex flex-col gap-3">
          {canManage && (
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => navigate(`/suppliers/${supplier.id}/edit`)}
            >
              <Pencil className="size-4" />
              Edit Supplier
            </Button>
          )}

          {canManage && supplier.isActive && (
            <Button
              variant="destructive"
              className="w-full justify-start gap-2"
              onClick={() => setDeactivateSheetOpen(true)}
            >
              <Trash2 className="size-4" />
              Deactivate Supplier
            </Button>
          )}
        </section>
      </div>

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        supplierId={id!}
      />

      {/* Deactivate confirm sheet */}
      <ConfirmSheet
        open={deactivateSheetOpen}
        onOpenChange={setDeactivateSheetOpen}
        title="Deactivate Supplier"
        description={`Are you sure you want to deactivate "${supplier.name}"? They will no longer appear in your active supplier list.`}
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        onConfirm={handleDeactivate}
        variant="destructive"
      />
    </div>
  );
}
