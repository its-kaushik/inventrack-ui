import { useState, useCallback, useMemo, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Loader2,
  CreditCard,
  Banknote,
  Smartphone,
  BookOpen,
  User,
  Search,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import { createBill } from '@/api/bills.api'
import type { CreateBillData } from '@/api/bills.api'
import { searchCustomersByPhone } from '@/api/customers.api'
import { queryKeys } from '@/api/query-keys'
import {
  useCartStore,
  selectNetAmount,
} from '@/stores/cart.store'
import type { PaymentMode } from '@/types/enums'
import type { Customer } from '@/types/models'
import { Amount } from '@/components/data/amount'
import { CurrencyInput } from '@/components/form/currency-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { CustomerQuickAdd } from './customer-quick-add'
import { cn } from '@/lib/utils'
import { ApiError } from '@/types/api'

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PaymentEntry {
  mode: PaymentMode
  amount: number
  reference: string
}

export function PaymentModal({ open, onOpenChange }: PaymentModalProps) {
  const navigate = useNavigate()
  const netAmount = useCartStore(selectNetAmount)
  const items = useCartStore((s) => s.items)
  const additionalDiscountAmount = useCartStore((s) => s.additionalDiscountAmount)
  const additionalDiscountPct = useCartStore((s) => s.additionalDiscountPct)
  const setCustomer = useCartStore((s) => s.setCustomer)
  const clearCart = useCartStore((s) => s.clear)

  // Payment rows
  const [cashAmount, setCashAmount] = useState(0)
  const [upiAmount, setUpiAmount] = useState(0)
  const [cardAmount, setCardAmount] = useState(0)
  const [creditEnabled, setCreditEnabled] = useState(false)
  const [upiRef, setUpiRef] = useState('')
  const [cardRef, setCardRef] = useState('')

  // Customer search
  const [phoneSearch, setPhoneSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const { data: customerResults = [] } = useQuery({
    queryKey: queryKeys.customers.search(phoneSearch),
    queryFn: () =>
      searchCustomersByPhone(phoneSearch).then((res) => res.data as Customer[]),
    enabled: phoneSearch.length >= 3,
  })

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCashAmount(0)
      setUpiAmount(0)
      setCardAmount(0)
      setCreditEnabled(false)
      setUpiRef('')
      setCardRef('')
      setPhoneSearch('')
      setSelectedCustomer(null)
      setShowQuickAdd(false)
    }
  }, [open])

  const totalPaid = cashAmount + upiAmount + cardAmount
  const balance = netAmount - totalPaid

  const fillCash = useCallback(() => {
    const remaining = netAmount - upiAmount - cardAmount
    setCashAmount(Math.max(0, Math.round(remaining * 100) / 100))
  }, [netAmount, upiAmount, cardAmount])

  const handleCustomerSelect = useCallback(
    (customer: Customer) => {
      setSelectedCustomer(customer)
      setCustomer(customer.id)
      setPhoneSearch('')
    },
    [setCustomer],
  )

  const clearCustomer = useCallback(() => {
    setSelectedCustomer(null)
    setCustomer(null)
    setCreditEnabled(false)
  }, [setCustomer])

  const handleQuickAddCreated = useCallback(
    (id: string, name: string) => {
      setSelectedCustomer({ id, name } as Customer)
      setCustomer(id)
      setShowQuickAdd(false)
    },
    [setCustomer],
  )

  // Build payment entries for the bill
  const payments = useMemo(() => {
    const entries: PaymentEntry[] = []
    if (cashAmount > 0) {
      entries.push({ mode: 'cash', amount: cashAmount, reference: '' })
    }
    if (upiAmount > 0) {
      entries.push({ mode: 'upi', amount: upiAmount, reference: upiRef })
    }
    if (cardAmount > 0) {
      entries.push({ mode: 'card', amount: cardAmount, reference: cardRef })
    }
    if (creditEnabled && balance > 0.01 && selectedCustomer) {
      entries.push({ mode: 'credit', amount: balance, reference: '' })
    }
    return entries
  }, [cashAmount, upiAmount, cardAmount, upiRef, cardRef, creditEnabled, balance, selectedCustomer])

  const totalWithCredit = useMemo(() => {
    return payments.reduce((sum, p) => sum + p.amount, 0)
  }, [payments])
  const isTotalBalanced = Math.abs(netAmount - totalWithCredit) < 0.01

  const billMutation = useMutation({
    mutationFn: (data: CreateBillData) => createBill(data),
    onSuccess: (response) => {
      const bill = response.data
      clearCart()
      onOpenChange(false)
      toast.success(`Bill ${bill.billNumber} created!`)
      navigate({
        to: '/pos/bills/$id',
        params: { id: bill.id },
      })
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.code === 'DISCOUNT_LIMIT_EXCEEDED') {
          toast.error('Discount exceeds the allowed limit.')
        } else if (error.code === 'PAYMENT_UNBALANCED') {
          toast.error('Payments do not match the bill total.')
        } else {
          toast.error(error.message || 'Failed to create bill.')
        }
      } else {
        toast.error('Failed to create bill. Please try again.')
      }
    },
  })

  const handleCompleteSale = useCallback(async () => {
    const billData: CreateBillData = {
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      payments: payments.map((p) => ({
        mode: p.mode,
        amount: p.amount,
        reference: p.reference || undefined,
      })),
      customerId: selectedCustomer?.id ?? null,
      additionalDiscountAmount:
        additionalDiscountAmount > 0 ? additionalDiscountAmount : undefined,
      additionalDiscountPct:
        additionalDiscountPct > 0 ? additionalDiscountPct : undefined,
      clientId: crypto.randomUUID(),
    }

    const isOnline = navigator.onLine
    if (!isOnline) {
      // Queue bill offline
      const { queueOfflineBill } = await import('@/lib/offline-bills')
      await queueOfflineBill(billData)
      toast.success('Bill saved offline — will sync when connected')
      clearCart()
      onOpenChange(false)
      return
    }

    billMutation.mutate(billData)
  }, [
    items,
    payments,
    selectedCustomer,
    additionalDiscountAmount,
    additionalDiscountPct,
    billMutation,
    clearCart,
    onOpenChange,
  ])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>
            Total due:{' '}
            <Amount
              value={netAmount}
              className="inline text-base font-bold text-foreground"
            />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Customer Section */}
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Customer
            </Label>

            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{selectedCustomer.name}</p>
                    {selectedCustomer.phone && (
                      <p className="text-xs text-muted-foreground">
                        {selectedCustomer.phone}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={clearCustomer}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : showQuickAdd ? (
              <CustomerQuickAdd
                initialPhone={phoneSearch}
                onCreated={handleQuickAddCreated}
                onCancel={() => setShowQuickAdd(false)}
              />
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={phoneSearch}
                    onChange={(e) =>
                      setPhoneSearch(e.target.value.replace(/[^0-9]/g, ''))
                    }
                    placeholder="Search by phone..."
                    inputMode="tel"
                    className="pl-8"
                  />
                </div>

                {/* Search results */}
                {customerResults.length > 0 && (
                  <div className="max-h-28 space-y-1 overflow-y-auto rounded-lg border p-1">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                        onClick={() => handleCustomerSelect(c)}
                      >
                        <User className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{c.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {c.phone}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setShowQuickAdd(true)}
                  >
                    + Add New
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setCustomer(null)
                      setPhoneSearch('')
                    }}
                  >
                    Walk-in
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Payment Rows */}
          <div className="space-y-3">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Payment Methods
            </Label>

            {/* Cash */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm">
                  <Banknote className="size-4 text-emerald-600" />
                  Cash
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-xs text-primary"
                  onClick={fillCash}
                >
                  Fill remaining
                </Button>
              </div>
              <CurrencyInput
                value={cashAmount}
                onChange={setCashAmount}
                placeholder="0"
              />
            </div>

            {/* UPI */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm">
                <Smartphone className="size-4 text-blue-600" />
                UPI
              </div>
              <CurrencyInput
                value={upiAmount}
                onChange={setUpiAmount}
                placeholder="0"
              />
              {upiAmount > 0 && (
                <Input
                  value={upiRef}
                  onChange={(e) => setUpiRef(e.target.value)}
                  placeholder="UPI reference (optional)"
                  className="text-xs"
                />
              )}
            </div>

            {/* Card */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm">
                <CreditCard className="size-4 text-purple-600" />
                Card
              </div>
              <CurrencyInput
                value={cardAmount}
                onChange={setCardAmount}
                placeholder="0"
              />
              {cardAmount > 0 && (
                <Input
                  value={cardRef}
                  onChange={(e) => setCardRef(e.target.value)}
                  placeholder="Card reference (optional)"
                  className="text-xs"
                />
              )}
            </div>

            {/* Credit toggle */}
            {selectedCustomer && (
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div className="flex items-center gap-1.5 text-sm">
                  <BookOpen className="size-4 text-amber-600" />
                  Credit (Khata)
                  {creditEnabled && balance > 0.01 && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({'\u20B9'}
                      {balance.toLocaleString('en-IN')})
                    </span>
                  )}
                </div>
                <Switch
                  checked={creditEnabled}
                  onCheckedChange={setCreditEnabled}
                  disabled={!selectedCustomer}
                />
              </div>
            )}
          </div>

          {/* Balance indicator */}
          <div
            className={cn(
              'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium',
              isTotalBalanced
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
            )}
          >
            <span>
              {isTotalBalanced
                ? 'Payments balanced'
                : totalWithCredit < netAmount
                  ? 'Underpaid'
                  : 'Overpaid'}
            </span>
            {!isTotalBalanced && (
              <Amount value={netAmount - totalWithCredit} className="text-sm" />
            )}
          </div>

          {/* Complete Sale */}
          <Button
            className="w-full h-11 text-base font-semibold"
            onClick={handleCompleteSale}
            disabled={!isTotalBalanced || billMutation.isPending || items.length === 0}
          >
            {billMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Complete Sale'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
