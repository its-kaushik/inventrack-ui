import { useState, useRef, useCallback, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Search, ShoppingCart, History, X, ScanBarcode, Camera, Pause, ListRestart } from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore, selectItemCount } from '@/stores/cart.store'
import { useUiStore } from '@/stores/ui.store'
import { useProductSearch } from '@/hooks/use-product-search'
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut'
import { useScanner } from '@/hooks/use-scanner'
import { useIsDesktop } from '@/hooks/use-media-query'
import { playScanFeedback } from '@/lib/feedback'
import { startCatalogSync, stopCatalogSync } from '@/lib/catalog-sync'
import type { Product } from '@/types/models'
import { Amount } from '@/components/data/amount'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CartItemRow } from '@/components/pos/cart-item'
import { TotalsBar } from '@/components/pos/totals-bar'
import { PaymentModal } from '@/components/pos/payment-modal'
import { EmptyState } from '@/components/data/empty-state'
import { CatalogSyncIndicator } from '@/components/feedback/catalog-sync-indicator'
import { CameraScanner } from '@/components/form/camera-scanner'

export const Route = createFileRoute('/_app/pos/')({
  component: PosBillingPage,
})

function PosBillingPage() {
  const isDesktop = useIsDesktop()
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const scanMode = useUiStore((s) => s.scanMode)
  const setScanMode = useUiStore((s) => s.setScanMode)

  const items = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const holdCurrentCart = useCartStore((s) => s.holdCurrentCart)
  const heldBillsCount = useCartStore((s) => s.heldBills.length)
  const itemCount = useCartStore(selectItemCount)

  const { results, isLoading } = useProductSearch(searchQuery)

  // Start catalog sync on mount
  useEffect(() => {
    startCatalogSync()
    return () => stopCatalogSync()
  }, [])

  // Barcode scanner hook (Bluetooth/USB) — active in scan mode
  const handleBarcodeScan = useCallback(
    (barcode: string) => {
      setSearchQuery(barcode)
      playScanFeedback()
    },
    [],
  )

  useScanner({
    onScan: handleBarcodeScan,
    enabled: scanMode === 'scan',
  })

  // Camera scan handler
  const handleCameraScan = useCallback(
    (barcode: string) => {
      setSearchQuery(barcode)
      playScanFeedback()
    },
    [],
  )

  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus()
  }, [])

  const openPayment = useCallback(() => {
    if (itemCount > 0) setPaymentOpen(true)
  }, [itemCount])

  const closePayment = useCallback(() => {
    setPaymentOpen(false)
  }, [])

  const handleHoldBill = useCallback(() => {
    if (itemCount === 0) return
    const note = window.prompt('Add a note for this held bill (optional):') ?? ''
    holdCurrentCart(note)
    toast.success('Bill held')
  }, [itemCount, holdCurrentCart])

  // Keyboard shortcuts
  useKeyboardShortcut('F1', focusSearch)
  useKeyboardShortcut('F2', openPayment)
  useKeyboardShortcut('Escape', closePayment)

  const handleProductSelect = useCallback(
    (product: Product) => {
      addItem(product)
      playScanFeedback()
      setSearchQuery('')
      searchInputRef.current?.focus()
    },
    [addItem],
  )

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && results.length === 1) {
        e.preventDefault()
        handleProductSelect(results[0])
      }
    },
    [results, handleProductSelect],
  )

  // Desktop: side-by-side layout
  if (isDesktop) {
    return (
      <div className="flex h-full">
        {/* Left panel: Search + Results (60%) */}
        <div className="flex w-[60%] flex-col border-r">
          <DesktopHeader
            scanMode={scanMode}
            onScanModeChange={setScanMode}
            onHold={handleHoldBill}
            heldCount={heldBillsCount}
            canHold={itemCount > 0}
          />
          {cameraOpen && (
            <div className="border-b p-3">
              <CameraScanner onScan={handleCameraScan} onClose={() => setCameraOpen(false)} />
            </div>
          )}
          <div className="flex items-center gap-1 border-b px-3 py-2">
            <div className="flex-1">
              <SearchBar
                ref={searchInputRef}
                value={searchQuery}
                onChange={setSearchQuery}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Camera scanner"
              onClick={() => setCameraOpen((o) => !o)}
            >
              <Camera className="size-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {searchQuery.length >= 2 ? (
              <SearchResults
                results={results}
                isLoading={isLoading}
                onSelect={handleProductSelect}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Search className="mx-auto mb-2 size-10 opacity-30" />
                  <p className="text-sm">
                    Scan barcode or type to search products
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    F1 to focus search, F2 to pay
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Cart + Totals (40%) */}
        <div className="flex w-[40%] flex-col">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-4" />
              <span className="text-sm font-semibold">Cart</span>
              {itemCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {itemCount}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {items.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="Cart is empty"
                description="Search and add products to begin billing"
                className="py-16"
              />
            ) : (
              items.map((item) => (
                <CartItemRow key={item.productId} item={item} />
              ))
            )}
          </div>

          <TotalsBar onPay={openPayment} />
        </div>

        <PaymentModal open={paymentOpen} onOpenChange={setPaymentOpen} />
      </div>
    )
  }

  // Mobile: stacked layout
  return (
    <div className="flex h-full flex-col">
      <MobileHeader
        itemCount={itemCount}
        scanMode={scanMode}
        onScanModeChange={setScanMode}
        onHold={handleHoldBill}
        heldCount={heldBillsCount}
        canHold={itemCount > 0}
      />
      {cameraOpen && (
        <div className="border-b p-3">
          <CameraScanner onScan={handleCameraScan} onClose={() => setCameraOpen(false)} />
        </div>
      )}
      <div className="flex items-center gap-1 border-b px-3 py-2">
        <div className="flex-1">
          <SearchBar
            ref={searchInputRef}
            value={searchQuery}
            onChange={setSearchQuery}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Camera scanner"
          onClick={() => setCameraOpen((o) => !o)}
        >
          <Camera className="size-4" />
        </Button>
      </div>

      {/* Search results overlay or cart */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery.length >= 2 ? (
          <div className="p-3">
            <SearchResults
              results={results}
              isLoading={isLoading}
              onSelect={handleProductSelect}
            />
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {items.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="Cart is empty"
                description="Search and add products to begin billing"
                className="py-12"
              />
            ) : (
              items.map((item) => (
                <CartItemRow key={item.productId} item={item} compact />
              ))
            )}
          </div>
        )}
      </div>

      <TotalsBar onPay={openPayment} />
      <PaymentModal open={paymentOpen} onOpenChange={setPaymentOpen} />
    </div>
  )
}

// --- Sub-components ---

function DesktopHeader({
  scanMode,
  onScanModeChange,
  onHold,
  heldCount,
  canHold,
}: {
  scanMode: 'type' | 'scan'
  onScanModeChange: (mode: 'type' | 'scan') => void
  onHold: () => void
  heldCount: number
  canHold: boolean
}) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-2">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold">POS Billing</h1>
        <CatalogSyncIndicator />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={scanMode === 'scan' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onScanModeChange(scanMode === 'scan' ? 'type' : 'scan')}
        >
          <ScanBarcode className="mr-1 size-3.5" />
          {scanMode === 'scan' ? 'Scan Mode' : 'Type Mode'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onHold}
          disabled={!canHold}
          title="Hold current bill"
        >
          <Pause className="mr-1 size-3.5" />
          Hold
        </Button>
        <Link to="/pos/held">
          <Button variant="ghost" size="sm" className="relative">
            <ListRestart className="mr-1 size-3.5" />
            Recall
            {heldCount > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">
                {heldCount}
              </Badge>
            )}
          </Button>
        </Link>
        <Link to="/pos/bills">
          <Button variant="ghost" size="sm">
            <History className="mr-1 size-3.5" />
            History
          </Button>
        </Link>
      </div>
    </div>
  )
}

function MobileHeader({
  itemCount,
  scanMode,
  onScanModeChange,
  onHold,
  heldCount,
  canHold,
}: {
  itemCount: number
  scanMode: 'type' | 'scan'
  onScanModeChange: (mode: 'type' | 'scan') => void
  onHold: () => void
  heldCount: number
  canHold: boolean
}) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-2">
      <div className="flex items-center gap-2">
        <h1 className="text-base font-bold">POS</h1>
        <CatalogSyncIndicator />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={scanMode === 'scan' ? 'default' : 'ghost'}
          size="icon-sm"
          title={scanMode === 'scan' ? 'Scan Mode' : 'Type Mode'}
          onClick={() => onScanModeChange(scanMode === 'scan' ? 'type' : 'scan')}
        >
          <ScanBarcode className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Hold current bill"
          onClick={onHold}
          disabled={!canHold}
        >
          <Pause className="size-4" />
        </Button>
        <Link to="/pos/held">
          <Button variant="ghost" size="icon-sm" className="relative">
            <ListRestart className="size-4" />
            {heldCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 text-[10px] px-1 py-0 min-w-4 h-4"
              >
                {heldCount}
              </Badge>
            )}
          </Button>
        </Link>
        <Link to="/pos/bills">
          <Button variant="ghost" size="icon-sm">
            <History className="size-4" />
          </Button>
        </Link>
        {itemCount > 0 && (
          <Badge variant="default" className="text-xs">
            {itemCount}
          </Badge>
        )}
      </div>
    </div>
  )
}

interface SearchBarProps {
  value: string
  onChange: (val: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

import { forwardRef } from 'react'

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar({ value, onChange, onKeyDown }, ref) {
    return (
      <div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Scan barcode or search product..."
            className="pl-8 pr-8"
            autoFocus
          />
          {value && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="absolute right-1 top-1/2 -translate-y-1/2"
              onClick={() => onChange('')}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    )
  },
)

interface SearchResultsProps {
  results: Product[]
  isLoading: boolean
  onSelect: (product: Product) => void
}

function SearchResults({ results, isLoading, onSelect }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No products found
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {results.map((product) => (
        <button
          key={product.id}
          type="button"
          className="flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted"
          onClick={() => onSelect(product)}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {product.name}
              {product.size && (
                <span className="ml-1 text-muted-foreground">
                  ({product.size})
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {product.sku}
              {product.barcode && ` | ${product.barcode}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <Amount value={product.sellingPrice} className="text-sm font-semibold" />
            {product.catalogDiscountPct > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                -{product.catalogDiscountPct}% off
              </Badge>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
