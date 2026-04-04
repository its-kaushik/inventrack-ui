import { Trash2 } from 'lucide-react'
import type { CartItem as CartItemType } from '@/stores/cart.store'
import { useCartStore } from '@/stores/cart.store'
import { Amount } from '@/components/data/amount'
import { QtyStepper } from '@/components/form/qty-stepper'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CartItemRowProps {
  item: CartItemType
  compact?: boolean
}

export function CartItemRow({ item, compact }: CartItemRowProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  const { product, productId, quantity, lineTotal } = item
  const hasCatalogDiscount = product.catalogDiscountPct > 0

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-card px-3 py-2',
        compact && 'gap-2 px-2 py-1.5',
      )}
    >
      {/* Product info */}
      <div className="min-w-0 flex-1">
        <p className={cn('truncate font-medium', compact ? 'text-sm' : 'text-sm')}>
          {product.name}
          {product.size && (
            <span className="ml-1 text-muted-foreground">({product.size})</span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <Amount
            value={product.sellingPrice}
            className="text-xs text-muted-foreground"
          />
          {hasCatalogDiscount && (
            <Badge variant="secondary" className="text-[10px]">
              -{product.catalogDiscountPct}%
            </Badge>
          )}
        </div>
      </div>

      {/* Quantity stepper */}
      <QtyStepper
        value={quantity}
        onChange={(qty) => updateQuantity(productId, qty)}
        min={1}
      />

      {/* Line total */}
      <Amount
        value={lineTotal}
        className={cn('w-20 text-right text-sm font-semibold', compact && 'w-16')}
      />

      {/* Remove */}
      <Button
        variant="ghost"
        size="icon-xs"
        className="shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => removeItem(productId)}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}
