import { useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Printer,
  Search,
  X,
  Loader2,
  Plus,
  Tag,
} from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { searchProducts } from '@/api/products.api'
import { generateLabels } from '@/api/labels.api'
import type { Product, LabelItem } from '@/types/models'
import { SearchInput } from '@/components/form/search-input'
import { QtyStepper } from '@/components/form/qty-stepper'
import { Amount } from '@/components/data/amount'
import { EmptyState } from '@/components/data/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export const Route = createFileRoute('/_app/inventory/labels')({
  component: LabelManagerPage,
})

interface PrintListEntry {
  product: Product
  quantity: number
}

function LabelManagerPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [printList, setPrintList] = useState<PrintListEntry[]>([])
  const [templateId, setTemplateId] = useState('standard')
  const [generatedLabels, setGeneratedLabels] = useState<LabelItem[] | null>(null)

  // Product search
  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: queryKeys.products.search(searchQuery),
    queryFn: () => searchProducts(searchQuery).then((res) => res.data),
    enabled: searchQuery.length >= 2,
  })

  // Label generation
  const generateMutation = useMutation({
    mutationFn: generateLabels,
    onSuccess: (response) => {
      setGeneratedLabels(response.data)
      toast.success('Labels generated successfully.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to generate labels.')
    },
  })

  const addToList = useCallback(
    (product: Product) => {
      setPrintList((prev) => {
        const existing = prev.find((entry) => entry.product.id === product.id)
        if (existing) {
          return prev.map((entry) =>
            entry.product.id === product.id
              ? { ...entry, quantity: entry.quantity + 1 }
              : entry,
          )
        }
        return [...prev, { product, quantity: 1 }]
      })
      setSearchQuery('')
    },
    [],
  )

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setPrintList((prev) =>
      prev.map((entry) =>
        entry.product.id === productId ? { ...entry, quantity } : entry,
      ),
    )
  }, [])

  const removeFromList = useCallback((productId: string) => {
    setPrintList((prev) => prev.filter((entry) => entry.product.id !== productId))
  }, [])

  function handleGenerate() {
    if (printList.length === 0) {
      toast.error('Add at least one product to the print list.')
      return
    }
    generateMutation.mutate({
      items: printList.map((entry) => ({
        productId: entry.product.id,
        quantity: entry.quantity,
      })),
      templateId: templateId === 'standard' ? undefined : templateId,
    })
  }

  function handlePrint() {
    window.print()
  }

  // Filter search results to exclude products already in print list
  const filteredResults = searchResults.filter(
    (product) => !printList.some((entry) => entry.product.id === product.id),
  )

  return (
    <>
      {/* Main page content - hidden during printing */}
      <div className="no-print space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Barcode / Label Manager</h1>
          <p className="text-sm text-muted-foreground">
            Search products, set quantities, and generate printable labels.
          </p>
        </div>

        {/* Product Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="size-4" />
              Search Products
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, SKU, or barcode..."
            />

            {/* Search Results */}
            {searchQuery.length >= 2 && (
              <div className="max-h-60 overflow-y-auto rounded-lg border">
                {isSearching ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredResults.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No products found.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {filteredResults.map((product) => (
                      <li
                        key={product.id}
                        className="flex items-center justify-between px-3 py-2 hover:bg-muted/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-mono">{product.sku}</span>
                            {product.size && <span> &middot; {product.size}</span>}
                            {' '}&middot;{' '}
                            <Amount value={product.sellingPrice} />
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => addToList(product)}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Print List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="size-4" />
              Print List ({printList.length} product{printList.length !== 1 ? 's' : ''})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {printList.length === 0 ? (
              <EmptyState
                icon={Tag}
                title="No products added"
                description="Search for products above and add them to generate labels."
                className="py-8"
              />
            ) : (
              <div className="space-y-2">
                {printList.map((entry) => (
                  <div
                    key={entry.product.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{entry.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{entry.product.sku}</span>
                        {entry.product.barcode && (
                          <span> &middot; {entry.product.barcode}</span>
                        )}
                        {entry.product.size && (
                          <span> &middot; {entry.product.size}</span>
                        )}
                        {' '}&middot;{' '}
                        <Amount value={entry.product.sellingPrice} />
                      </p>
                    </div>
                    <QtyStepper
                      value={entry.quantity}
                      onChange={(qty) => updateQuantity(entry.product.id, qty)}
                      min={1}
                      max={100}
                    />
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeFromList(entry.product.id)}
                    >
                      <X className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Template & Generate */}
        {printList.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <Select value={templateId} onValueChange={(v) => v && setTemplateId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : (
                <Printer className="mr-1 size-4" />
              )}
              Generate & Print
            </Button>
          </div>
        )}

        {/* Generated Label Preview (on-screen view) */}
        {generatedLabels && generatedLabels.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Label Preview</CardTitle>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="mr-1 size-3.5" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {generatedLabels.map((label, idx) => (
                  <LabelCard key={`${label.sku}-${idx}`} label={label} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Print-only area */}
      {generatedLabels && generatedLabels.length > 0 && (
        <div className="print-area">
          <div className="label-grid">
            {generatedLabels.map((label, idx) => (
              <div key={`print-${label.sku}-${idx}`} className="label-cell">
                <p className="label-name">{label.productName}</p>
                <p className="label-sku">{label.sku}</p>
                {label.barcodeDataUrl && (
                  <img
                    src={label.barcodeDataUrl}
                    alt={label.barcode}
                    className="label-barcode"
                  />
                )}
                {label.size && <p className="label-size">Size: {label.size}</p>}
                <p className="label-price">{label.sellingPrice}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-area {
            display: block !important;
          }
          .label-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4mm;
            padding: 0;
          }
          .label-cell {
            border: 1px solid #ccc;
            padding: 3mm;
            text-align: center;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .label-name {
            font-size: 9pt;
            font-weight: 600;
            margin: 0 0 2mm;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .label-sku {
            font-size: 7pt;
            font-family: monospace;
            margin: 0 0 2mm;
            color: #555;
          }
          .label-barcode {
            display: block;
            margin: 0 auto 2mm;
            max-width: 100%;
            height: 12mm;
          }
          .label-size {
            font-size: 7pt;
            margin: 0 0 1mm;
            color: #555;
          }
          .label-price {
            font-size: 10pt;
            font-weight: 700;
            margin: 0;
          }
        }
        @media screen {
          .print-area {
            display: none;
          }
        }
      `}</style>
    </>
  )
}

function LabelCard({ label }: { label: LabelItem }) {
  return (
    <div className="flex flex-col items-center rounded-lg border p-3 text-center">
      <p className="truncate text-xs font-semibold">{label.productName}</p>
      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{label.sku}</p>
      {label.barcodeDataUrl && (
        <img
          src={label.barcodeDataUrl}
          alt={label.barcode}
          className="mt-1 h-10 max-w-full object-contain"
        />
      )}
      {label.size && (
        <p className="mt-1 text-[10px] text-muted-foreground">Size: {label.size}</p>
      )}
      <p className="mt-1 text-sm font-bold">{label.sellingPrice}</p>
    </div>
  )
}
