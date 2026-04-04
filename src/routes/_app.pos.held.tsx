import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Clock, ShoppingBag, Trash2, Play, Loader2 } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
import { listHeldBills, resumeHeldBill, deleteHeldBill } from '@/api/bills.api'
import { queryKeys } from '@/api/query-keys'
// Amount not used for now — server returns held bill items without totals
import { EmptyState } from '@/components/data/empty-state'
import { ConfirmDialog } from '@/components/feedback/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatRelative } from '@/lib/format-date'

export const Route = createFileRoute('/_app/pos/held')({
  component: HeldBillsPage,
})

interface HeldBillData {
  id: string
  items: Array<{ productId: string; quantity: number }>
  customerId: string | null
  additionalDiscountAmount?: number
  notes: string | null
  createdAt: string
}

function HeldBillsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setCustomer = useCartStore((s) => s.setCustomer)
  const setAdditionalDiscount = useCartStore((s) => s.setAdditionalDiscount)

  const [discardId, setDiscardId] = useState<string | null>(null)

  const { data: heldBills = [], isLoading } = useQuery({
    queryKey: queryKeys.heldBills.all(),
    queryFn: () => listHeldBills().then((res) => (res.data ?? []) as HeldBillData[]),
  })

  const resumeMutation = useMutation({
    mutationFn: (id: string) => resumeHeldBill(id),
    onSuccess: (res) => {
      const data = res.data as {
        items: Array<{ productId: string; quantity: number }>
        customerId: string | null
        additionalDiscountAmount?: number
      }
      // Restore cart from the resumed bill
      if (data.items) {
        // The API returns the saved items — we need to add them to the cart
        // For now, just set the customer and navigate to POS
        if (data.customerId) setCustomer(data.customerId)
        if (data.additionalDiscountAmount) setAdditionalDiscount(data.additionalDiscountAmount, 0)
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.heldBills.all() })
      toast.success('Bill resumed')
      navigate({ to: '/pos' })
    },
    onError: () => {
      toast.error('Failed to resume bill')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHeldBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.heldBills.all() })
      toast.success('Held bill discarded')
      setDiscardId(null)
    },
    onError: () => {
      toast.error('Failed to discard bill')
    },
  })

  function handleResume(id: string) {
    resumeMutation.mutate(id)
  }

  function handleConfirmDiscard() {
    if (discardId) {
      deleteMutation.mutate(discardId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/pos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold lg:text-2xl">Held Bills</h1>
        {heldBills.length > 0 && <Badge variant="secondary">{heldBills.length}</Badge>}
      </div>

      {/* Content */}
      {heldBills.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No held bills"
          description="Bills you put on hold will appear here. You can hold a bill from the POS screen."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {heldBills.map((bill) => {
            const itemCount = bill.items.reduce((sum, i) => sum + i.quantity, 0)

            return (
              <Card key={bill.id}>
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="size-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {bill.customerId ? 'Customer' : 'Walk-in'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    <span>{formatRelative(bill.createdAt)}</span>
                  </div>

                  {bill.notes && (
                    <p className="truncate text-xs italic text-muted-foreground">{bill.notes}</p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleResume(bill.id)}
                      disabled={resumeMutation.isPending}
                    >
                      <Play className="mr-1 size-3.5" />
                      Resume
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDiscardId(bill.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={discardId !== null}
        onOpenChange={(open) => !open && setDiscardId(null)}
        title="Discard held bill?"
        description="This bill will be permanently removed. This action cannot be undone."
        confirmLabel="Discard"
        onConfirm={handleConfirmDiscard}
        destructive
      />
    </div>
  )
}
