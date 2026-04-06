import { useState, useMemo } from 'react';
import {
  IndianRupee,
  Clock,
  AlertTriangle,
  CheckCircle,
  Lock,
  Unlock,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout';
import { MetricCard, CurrencyInput, StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  useCurrentRegister,
  useOpenRegister,
  useCloseRegister,
} from '@/hooks/use-expenses';
import { formatINR, parseAmount } from '@/lib/currency';
import { formatDateTime } from '@/lib/format-date';
import { cn } from '@/lib/cn';

// ── Skeleton ──

function RegisterSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 py-4 desktop:px-6">
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-card p-4 shadow-sm">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
        ))}
      </div>
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

// ── Open Register Form ──

function OpenRegisterForm() {
  const openRegister = useOpenRegister();
  const [openingBalance, setOpeningBalance] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const handleOpen = () => {
    if (openingBalance === '' || openingBalance < 0) {
      toast.error('Please enter a valid opening balance');
      return;
    }
    openRegister.mutate({
      openingBalance,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="flex flex-1 items-start justify-center px-4 pt-8 desktop:px-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-warning-50">
            <Unlock className="size-7 text-warning-600" />
          </div>
          <CardTitle>Cash register is not open for today</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the opening cash balance to start the day.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Opening Balance</Label>
            <CurrencyInput
              value={openingBalance}
              onChange={setOpeningBalance}
              placeholder="Enter opening balance"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="open-notes">Notes (optional)</Label>
            <Textarea
              id="open-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes..."
              rows={2}
            />
          </div>

          <Button
            onClick={handleOpen}
            disabled={openRegister.isPending || openingBalance === ''}
            className="w-full"
          >
            {openRegister.isPending ? 'Opening...' : 'Open Register'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Register Summary Metrics ──

function RegisterMetrics({
  register,
}: {
  register: {
    openingBalance: string;
    totalCashSales: string;
    totalCashReceived: string;
    totalCashExpenses: string;
    totalCashPaidToSuppliers: string;
  };
}) {
  const opening = parseAmount(register.openingBalance);
  const sales = parseAmount(register.totalCashSales);
  const received = parseAmount(register.totalCashReceived);
  const expenses = parseAmount(register.totalCashExpenses);
  const paidToSuppliers = parseAmount(register.totalCashPaidToSuppliers);
  const totalOutflow = expenses + paidToSuppliers;

  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard label="Opening Balance" value={formatINR(opening)} />
      <MetricCard label="Cash Sales" value={formatINR(sales)} />
      <MetricCard label="Cash Received (Credit)" value={formatINR(received)} />
      <MetricCard label="Cash Expenses" value={formatINR(totalOutflow)} />
    </div>
  );
}

// ── Open Register View ──

function OpenRegisterView({
  register,
}: {
  register: {
    openingBalance: string;
    totalCashSales: string;
    totalCashReceived: string;
    totalCashExpenses: string;
    totalCashPaidToSuppliers: string;
    expectedCash: string;
  };
}) {
  const closeRegister = useCloseRegister();
  const [actualCash, setActualCash] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const expectedCash = parseAmount(register.expectedCash);

  const discrepancy = useMemo(() => {
    if (actualCash === '') return null;
    return actualCash - expectedCash;
  }, [actualCash, expectedCash]);

  const handleClose = () => {
    if (actualCash === '') {
      toast.error('Please enter the actual cash count');
      return;
    }
    closeRegister.mutate({
      actualCash,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="flex flex-col gap-5 px-4 pb-8 desktop:max-w-2xl desktop:px-6">
      {/* Status */}
      <div className="flex items-center gap-2">
        <StatusBadge status="amber" label="Open" />
        <span className="text-sm text-muted-foreground">Register is open for today</span>
      </div>

      {/* Metrics */}
      <RegisterMetrics register={register} />

      {/* Expected cash */}
      <div className="rounded-xl bg-success-50 p-4 text-center">
        <p className="text-sm font-medium text-success-700">Expected Cash</p>
        <p className="mt-1 text-3xl font-bold text-success-800">
          {formatINR(expectedCash)}
        </p>
      </div>

      <Separator />

      {/* Close register */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="size-4" />
            Close Register
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Enter actual cash count</Label>
            <CurrencyInput
              value={actualCash}
              onChange={setActualCash}
              placeholder="Count and enter cash"
            />
          </div>

          {discrepancy !== null && (
            <div
              className={cn(
                'flex items-center gap-2 rounded-lg p-3 text-sm font-medium',
                discrepancy === 0
                  ? 'bg-success-50 text-success-700'
                  : 'bg-error-50 text-error-700',
              )}
            >
              {discrepancy === 0 ? (
                <CheckCircle className="size-4" />
              ) : (
                <AlertTriangle className="size-4" />
              )}
              Discrepancy: {formatINR(Math.abs(discrepancy))}
              {discrepancy > 0 && ' (excess)'}
              {discrepancy < 0 && ' (short)'}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="close-notes">Notes (optional)</Label>
            <Textarea
              id="close-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes on closing..."
              rows={2}
            />
          </div>

          <Button
            onClick={handleClose}
            disabled={closeRegister.isPending || actualCash === ''}
            className="w-full"
          >
            {closeRegister.isPending ? 'Closing...' : 'Close Register'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Closed Register View ──

function ClosedRegisterView({
  register,
}: {
  register: {
    openingBalance: string;
    totalCashSales: string;
    totalCashReceived: string;
    totalCashExpenses: string;
    totalCashPaidToSuppliers: string;
    expectedCash: string;
    actualCash: string | null;
    variance: string | null;
    closedAt: string | null;
    closedByName: string | null;
  };
}) {
  const expectedCash = parseAmount(register.expectedCash);
  const actualCash = parseAmount(register.actualCash);
  const variance = parseAmount(register.variance);
  const varianceIsZero = variance === 0;

  return (
    <div className="flex flex-col gap-5 px-4 pb-8 desktop:max-w-2xl desktop:px-6">
      {/* Status */}
      <div className="flex items-center gap-2">
        <StatusBadge status="green" label="Closed" />
        <span className="text-sm text-muted-foreground">
          Register is closed for today
        </span>
      </div>

      {/* Metrics */}
      <RegisterMetrics register={register} />

      {/* Expected cash */}
      <div className="rounded-xl bg-neutral-50 p-4 text-center">
        <p className="text-sm font-medium text-neutral-600">Expected Cash</p>
        <p className="mt-1 text-2xl font-bold text-neutral-900">
          {formatINR(expectedCash)}
        </p>
      </div>

      {/* Actual + Variance */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Actual Cash" value={formatINR(actualCash)} />
        <MetricCard
          label="Variance"
          value={formatINR(variance)}
          className={cn(
            varianceIsZero
              ? 'ring-1 ring-success-200 bg-success-50'
              : Math.abs(variance) > 100
                ? 'ring-1 ring-error-200 bg-error-50'
                : 'ring-1 ring-warning-200 bg-warning-50',
          )}
        />
      </div>

      {/* Closed info */}
      <div className="flex items-center gap-2 rounded-lg bg-neutral-50 p-3 text-sm text-muted-foreground">
        <Clock className="size-4 shrink-0" />
        <span>
          Closed at {formatDateTime(register.closedAt)}
          {register.closedByName ? ` by ${register.closedByName}` : ''}
        </span>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function CashRegisterPage() {
  const { data: register, isLoading } = useCurrentRegister();

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader title="Cash Register" />

      {isLoading ? (
        <RegisterSkeleton />
      ) : register === null || register === undefined ? (
        <OpenRegisterForm />
      ) : register.status === 'open' ? (
        <OpenRegisterView register={register} />
      ) : (
        <ClosedRegisterView register={register} />
      )}
    </div>
  );
}
