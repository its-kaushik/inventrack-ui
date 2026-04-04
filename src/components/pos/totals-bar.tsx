import { useState, useCallback } from 'react'
import { Percent, IndianRupee } from 'lucide-react'
import {
  useCartStore,
  selectSubtotal,
  selectCatalogDiscountTotal,
  selectNetAmount,
  selectItemCount,
} from '@/stores/cart.store'
import { Amount } from '@/components/data/amount'
import { CurrencyInput } from '@/components/form/currency-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface TotalsBarProps {
  onPay: () => void
  className?: string
}

export function TotalsBar({ onPay, className }: TotalsBarProps) {
  const subtotal = useCartStore(selectSubtotal)
  const catalogDiscountTotal = useCartStore(selectCatalogDiscountTotal)
  const netAmount = useCartStore(selectNetAmount)
  const itemCount = useCartStore(selectItemCount)
  const additionalDiscountAmount = useCartStore((s) => s.additionalDiscountAmount)
  const additionalDiscountPct = useCartStore((s) => s.additionalDiscountPct)
  const setAdditionalDiscount = useCartStore((s) => s.setAdditionalDiscount)

  const [discountSheetOpen, setDiscountSheetOpen] = useState(false)
  const [discountMode, setDiscountMode] = useState<'flat' | 'percent'>(
    additionalDiscountPct > 0 ? 'percent' : 'flat',
  )
  const [flatValue, setFlatValue] = useState(additionalDiscountAmount)
  const [pctValue, setPctValue] = useState(String(additionalDiscountPct || ''))

  const openDiscountSheet = useCallback(() => {
    setFlatValue(additionalDiscountAmount)
    setPctValue(String(additionalDiscountPct || ''))
    setDiscountMode(additionalDiscountPct > 0 ? 'percent' : 'flat')
    setDiscountSheetOpen(true)
  }, [additionalDiscountAmount, additionalDiscountPct])

  const applyDiscount = useCallback(() => {
    if (discountMode === 'flat') {
      setAdditionalDiscount(flatValue, 0)
    } else {
      const pct = parseFloat(pctValue) || 0
      const amount = Math.round(subtotal * (pct / 100) * 100) / 100
      setAdditionalDiscount(amount, pct)
    }
    setDiscountSheetOpen(false)
  }, [discountMode, flatValue, pctValue, subtotal, setAdditionalDiscount])

  const hasItems = itemCount > 0

  return (
    <>
      <div
        className={cn(
          'space-y-2 border-t bg-card px-4 py-3',
          className,
        )}
      >
        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})
          </span>
          <Amount value={subtotal} className="text-sm" />
        </div>

        {/* Catalog discount */}
        {catalogDiscountTotal > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Catalog Discount</span>
            <Amount value={-catalogDiscountTotal} className="text-sm text-emerald-600" />
          </div>
        )}

        {/* Additional discount */}
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            className="text-primary underline-offset-2 hover:underline"
            onClick={openDiscountSheet}
            disabled={!hasItems}
          >
            Add'l Discount
            {additionalDiscountAmount > 0 && (
              <span className="ml-1 text-muted-foreground">
                {additionalDiscountPct > 0
                  ? `(${additionalDiscountPct}%)`
                  : ''}
              </span>
            )}
          </button>
          {additionalDiscountAmount > 0 ? (
            <Amount
              value={-additionalDiscountAmount}
              className="text-sm text-emerald-600"
            />
          ) : (
            <span className="text-sm text-muted-foreground">--</span>
          )}
        </div>

        {/* Net Payable */}
        <div className="flex items-center justify-between border-t pt-2">
          <span className="text-base font-semibold">Net Payable</span>
          <Amount
            value={netAmount}
            className="text-2xl font-bold font-mono"
          />
        </div>

        {/* PAY button */}
        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={onPay}
          disabled={!hasItems}
        >
          PAY {hasItems && <Amount value={netAmount} className="ml-1 text-base text-primary-foreground" />}
        </Button>
      </div>

      {/* Discount Sheet */}
      <Sheet open={discountSheetOpen} onOpenChange={setDiscountSheetOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Additional Discount</SheetTitle>
            <SheetDescription>
              Apply a flat amount or percentage discount
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 p-4">
            {/* Mode toggle */}
            <div className="flex gap-2">
              <Button
                variant={discountMode === 'flat' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDiscountMode('flat')}
              >
                <IndianRupee className="mr-1 size-3.5" />
                Flat Amount
              </Button>
              <Button
                variant={discountMode === 'percent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDiscountMode('percent')}
              >
                <Percent className="mr-1 size-3.5" />
                Percentage
              </Button>
            </div>

            {/* Input */}
            {discountMode === 'flat' ? (
              <div className="space-y-1.5">
                <Label>Discount Amount</Label>
                <CurrencyInput
                  value={flatValue}
                  onChange={setFlatValue}
                  placeholder="0"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Discount Percentage</Label>
                <div className="relative">
                  <Input
                    inputMode="decimal"
                    value={pctValue}
                    onChange={(e) => {
                      const raw = e.target.value
                      if (/^[0-9]*\.?[0-9]*$/.test(raw)) {
                        setPctValue(raw)
                      }
                    }}
                    placeholder="0"
                    className="pr-8 font-mono tabular-nums text-right"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
                {pctValue && (
                  <p className="text-xs text-muted-foreground">
                    = {'\u20B9'}
                    {(
                      Math.round(
                        subtotal * ((parseFloat(pctValue) || 0) / 100) * 100,
                      ) / 100
                    ).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            )}

            <Button className="w-full" onClick={applyDiscount}>
              Apply Discount
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
