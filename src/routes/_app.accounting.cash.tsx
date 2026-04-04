import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Wallet, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import {
  getCurrentRegister,
  openRegister,
  closeRegister,
  getRegisterHistory,
} from '@/api/cash-register.api'
import type { CashRegister } from '@/types/models'
import { Amount } from '@/components/data/amount'
import { CurrencyInput } from '@/components/form/currency-input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { formatDateTime } from '@/lib/format-date'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/accounting/cash')({
  component: CashRegisterPage,
})

function CashRegisterPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cash Register</h1>
      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">Current</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="current">
          <CurrentRegisterTab />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Current Register Tab
// ---------------------------------------------------------------------------

function CurrentRegisterTab() {
  const { data: register, isLoading, error } = useQuery({
    queryKey: queryKeys.cashRegister.current(),
    queryFn: () => getCurrentRegister().then((res) => res.data),
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // If error or no register (404 when none open), show open form
  if (error || !register || register.status === 'closed') {
    return <OpenRegisterForm />
  }

  return <ActiveRegister register={register} />
}

// ---------------------------------------------------------------------------
// Open Register Form
// ---------------------------------------------------------------------------

function OpenRegisterForm() {
  const queryClient = useQueryClient()
  const [openingBalance, setOpeningBalance] = useState(0)

  const mutation = useMutation({
    mutationFn: () => openRegister(openingBalance),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.cashRegister.current(),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.cashRegister.history(),
      })
      toast.success('Register opened.')
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Failed to open register.',
      )
    },
  })

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted">
          <Wallet className="size-7 text-muted-foreground" />
        </div>
        <CardTitle className="mt-2">Open Register</CardTitle>
        <CardDescription>
          Enter the cash amount you are starting with today.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Opening Balance
          </label>
          <CurrencyInput
            value={openingBalance}
            onChange={setOpeningBalance}
            placeholder="0"
          />
        </div>
        <Button
          className="w-full"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending && (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          )}
          Open Register
        </Button>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Active Register View
// ---------------------------------------------------------------------------

function ActiveRegister({ register }: { register: CashRegister }) {
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)

  const currentBalance = register.currentBalance
    ? Number(register.currentBalance)
    : Number(register.openingBalance)

  return (
    <>
      <div className="space-y-4">
        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 pt-1">
              <Wallet className="size-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Opening Balance
                </p>
                <Amount
                  value={Number(register.openingBalance)}
                  className="text-lg font-semibold"
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-1">
              <Clock className="size-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Opened At</p>
                <p className="text-sm font-medium">
                  {formatDateTime(register.openedAt)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-1">
              <Wallet className="size-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Current Balance
                </p>
                <Amount
                  value={currentBalance}
                  className="text-lg font-semibold"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Entries list */}
        <Card>
          <CardHeader>
            <CardTitle>Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {register.entries && register.entries.length > 0 ? (
              <div className="space-y-2">
                {register.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.type} &middot;{' '}
                        {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                    <Amount
                      value={Number(entry.amount)}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No cash movements yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Close button */}
        <div className="flex justify-end">
          <Button
            variant="destructive"
            onClick={() => setCloseDialogOpen(true)}
          >
            Close Register
          </Button>
        </div>
      </div>

      <CloseRegisterDialog
        register={register}
        expectedBalance={currentBalance}
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Close Register Dialog
// ---------------------------------------------------------------------------

interface CloseDialogProps {
  register: CashRegister
  expectedBalance: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CloseRegisterDialog({
  register,
  expectedBalance,
  open,
  onOpenChange,
}: CloseDialogProps) {
  const queryClient = useQueryClient()
  const [countedCash, setCountedCash] = useState(0)

  const discrepancy = countedCash - expectedBalance

  const mutation = useMutation({
    mutationFn: () => closeRegister(register.id, countedCash),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.cashRegister.current(),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.cashRegister.history(),
      })
      toast.success('Register closed successfully.')
      onOpenChange(false)
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Failed to close register.',
      )
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close Register</DialogTitle>
          <DialogDescription>
            Count the cash in your drawer and enter the total below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Counted Cash
            </label>
            <CurrencyInput
              value={countedCash}
              onChange={setCountedCash}
              placeholder="0"
            />
          </div>

          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Expected Balance</span>
              <Amount value={expectedBalance} className="text-sm" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Counted Cash</span>
              <Amount value={countedCash} className="text-sm" />
            </div>
            <div className="border-t pt-2">
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="flex items-center gap-1.5">
                  {discrepancy !== 0 && (
                    <AlertCircle className="size-3.5 text-destructive" />
                  )}
                  Discrepancy
                </span>
                <span
                  className={cn(
                    'font-mono tabular-nums',
                    discrepancy === 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-destructive',
                  )}
                >
                  {discrepancy >= 0 ? '+' : ''}
                  {discrepancy.toLocaleString('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending && (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            )}
            Close &amp; Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// History Tab
// ---------------------------------------------------------------------------

function HistoryTab() {
  const { data: history, isLoading } = useQuery({
    queryKey: queryKeys.cashRegister.history(),
    queryFn: () => getRegisterHistory().then((res) => res.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No register sessions yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {history.map((reg) => (
        <HistoryRow key={reg.id} register={reg} />
      ))}
    </div>
  )
}

function HistoryRow({ register }: { register: CashRegister }) {
  const discrepancy = register.discrepancy ? Number(register.discrepancy) : 0

  return (
    <Card>
      <CardContent className="grid gap-4 sm:grid-cols-5">
        <div>
          <p className="text-xs text-muted-foreground">Opened</p>
          <p className="text-sm font-medium">
            {formatDateTime(register.openedAt)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Closed</p>
          <p className="text-sm font-medium">
            {register.closedAt ? formatDateTime(register.closedAt) : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Opening</p>
          <Amount
            value={Number(register.openingBalance)}
            className="text-sm font-medium"
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Closing</p>
          <Amount
            value={
              register.actualClosing
                ? Number(register.actualClosing)
                : 0
            }
            className="text-sm font-medium"
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Discrepancy</p>
          <span
            className={cn(
              'text-sm font-medium font-mono tabular-nums',
              discrepancy === 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-destructive',
            )}
          >
            {discrepancy >= 0 ? '+' : ''}
            {discrepancy.toLocaleString('en-IN', {
              style: 'currency',
              currency: 'INR',
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
