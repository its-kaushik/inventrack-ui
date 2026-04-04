import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Clock, ShoppingBag, Trash2, Play } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
import type { HeldBill } from '@/stores/cart.store'
import { Amount } from '@/components/data/amount'
import { EmptyState } from '@/components/data/empty-state'
import { ConfirmDialog } from '@/components/feedback/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatRelative } from '@/lib/format-date'

export const Route = createFileRoute('/_app/pos/held')({
  component: HeldBillsPage,
})

function calcHeldTotal(bill: HeldBill): number {
  const subtotal = bill.items.reduce((sum, item) => sum + item.lineTotal, 0)
  return subtotal - bill.additionalDiscountAmount
}

function HeldBillsPage() {
  const navigate = useNavigate()
  const heldBills = useCartStore((s) => s.heldBills)
  const resumeHeldBill = useCartStore((s) => s.resumeHeldBill)
  const discardHeldBill = useCartStore((s) => s.discardHeldBill)

  const [discardId, setDiscardId] = useState<string | null>(null)

  function handleResume(id: string) {
    resumeHeldBill(id)
    navigate({ to: '/pos' })
  }

  function handleConfirmDiscard() {
    if (discardId) {
      discardHeldBill(discardId)
      setDiscardId(null)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/pos">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold lg:text-2xl">Held Bills</h1>
        {heldBills.length > 0 && (
          <Badge variant="secondary">{heldBills.length}</Badge>
        )}
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
            const total = calcHeldTotal(bill)

            return (
              <Card key={bill.id} size="sm">
                <CardContent className="space-y-3">
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
                    <Amount value={total} className="text-sm font-semibold" />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    <span>{formatRelative(bill.heldAt)}</span>
                  </div>

                  {bill.note && (
                    <p className="text-xs text-muted-foreground italic truncate">
                      {bill.note}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleResume(bill.id)}
                    >
                      <Play className="mr-1 size-3.5" />
                      Resume
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
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
