import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Save, ArrowLeft, Barcode, Type, Hash, Ruler, Tag, Store, IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/inventory/labels/design')({
  component: LabelTemplateDesignerPage,
})

const STORAGE_KEY = 'inventrack:label-template'

interface LabelFields {
  barcode: boolean
  productName: boolean
  sku: boolean
  size: boolean
  sellingPrice: boolean
  mrp: boolean
  storeName: boolean
}

type FontSize = 'small' | 'medium' | 'large'

interface LabelTemplateConfig {
  fields: LabelFields
  width: number
  height: number
  fontSize: FontSize
  showBorder: boolean
}

const DEFAULT_FIELDS: LabelFields = {
  barcode: true,
  productName: true,
  sku: true,
  size: false,
  sellingPrice: true,
  mrp: false,
  storeName: false,
}

const FIELD_META: {
  key: keyof LabelFields
  label: string
  icon: typeof Barcode
  required?: boolean
}[] = [
  { key: 'barcode', label: 'Barcode', icon: Barcode, required: true },
  { key: 'productName', label: 'Product Name', icon: Type },
  { key: 'sku', label: 'SKU', icon: Hash },
  { key: 'size', label: 'Size', icon: Ruler },
  { key: 'sellingPrice', label: 'Selling Price', icon: IndianRupee },
  { key: 'mrp', label: 'MRP', icon: Tag },
  { key: 'storeName', label: 'Store Name', icon: Store },
]

const FONT_SIZE_MAP: Record<FontSize, { pt: string; base: string; small: string }> = {
  small: { pt: '8pt', base: 'text-[8px]', small: 'text-[6px]' },
  medium: { pt: '10pt', base: 'text-[10px]', small: 'text-[8px]' },
  large: { pt: '12pt', base: 'text-xs', small: 'text-[10px]' },
}

function loadSavedConfig(): LabelTemplateConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as LabelTemplateConfig
  } catch {
    // ignore parse errors
  }
  return null
}

function LabelTemplateDesignerPage() {
  const saved = loadSavedConfig()

  const [fields, setFields] = useState<LabelFields>(saved?.fields ?? DEFAULT_FIELDS)
  const [width, setWidth] = useState(saved?.width ?? 50)
  const [height, setHeight] = useState(saved?.height ?? 25)
  const [fontSize, setFontSize] = useState<FontSize>(saved?.fontSize ?? 'medium')
  const [showBorder, setShowBorder] = useState(saved?.showBorder ?? true)

  function toggleField(key: keyof LabelFields) {
    if (key === 'barcode') return // barcode is always on
    setFields((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleSave() {
    const config: LabelTemplateConfig = {
      fields,
      width,
      height,
      fontSize,
      showBorder,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
      toast.success('Label template saved successfully.')
    } catch {
      toast.error('Failed to save label template.')
    }
  }

  // Scale factor: map mm to pixels for preview (roughly 3px per mm)
  const SCALE = 3
  const previewWidth = width * SCALE
  const previewHeight = height * SCALE
  const fontClasses = FONT_SIZE_MAP[fontSize]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/inventory/labels">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Label Template Designer</h1>
            <p className="text-sm text-muted-foreground">
              Configure which fields appear on barcode labels and set dimensions.
            </p>
          </div>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-1 size-4" />
          Save Template
        </Button>
      </div>

      {/* Two-panel layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Left panel: Configuration */}
        <div className="space-y-6">
          {/* Field toggles */}
          <Card>
            <CardHeader>
              <CardTitle>Label Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {FIELD_META.map((field) => {
                const Icon = field.icon
                return (
                  <div key={field.key} className="flex items-center gap-3">
                    <Checkbox
                      id={`field-${field.key}`}
                      checked={fields[field.key]}
                      onCheckedChange={() => toggleField(field.key)}
                      disabled={field.required}
                    />
                    <Label
                      htmlFor={`field-${field.key}`}
                      className={cn(
                        'flex cursor-pointer items-center gap-2',
                        field.required && 'cursor-not-allowed opacity-70',
                      )}
                    >
                      <Icon className="size-4 text-muted-foreground" />
                      {field.label}
                      {field.required && (
                        <span className="text-xs text-muted-foreground">(required)</span>
                      )}
                    </Label>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Dimensions & Style */}
          <Card>
            <CardHeader>
              <CardTitle>Dimensions &amp; Style</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Width & Height */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="label-width">Label Width</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="label-width"
                      type="number"
                      min={20}
                      max={200}
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value) || 50)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">mm</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="label-height">Label Height</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="label-height"
                      type="number"
                      min={10}
                      max={150}
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value) || 25)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">mm</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Font Size */}
              <div className="space-y-2">
                <Label>Font Size</Label>
                <RadioGroup
                  value={fontSize}
                  onValueChange={(val) => setFontSize(val as FontSize)}
                  className="flex gap-4"
                >
                  {(
                    [
                      { value: 'small', label: 'Small (8pt)' },
                      { value: 'medium', label: 'Medium (10pt)' },
                      { value: 'large', label: 'Large (12pt)' },
                    ] as const
                  ).map((opt) => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <RadioGroupItem value={opt.value} id={`font-${opt.value}`} />
                      <Label htmlFor={`font-${opt.value}`} className="cursor-pointer">
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Separator />

              {/* Show Border */}
              <div className="flex items-center justify-between">
                <Label htmlFor="show-border" className="cursor-pointer">
                  Show Border
                </Label>
                <Switch id="show-border" checked={showBorder} onCheckedChange={setShowBorder} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right panel: Live Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center rounded-lg bg-muted/30 p-6">
                <div
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 overflow-hidden bg-white p-2',
                    showBorder && 'border border-foreground/30',
                  )}
                  style={{
                    width: `${previewWidth}px`,
                    minWidth: `${previewWidth}px`,
                    height: `${previewHeight}px`,
                    minHeight: `${previewHeight}px`,
                  }}
                >
                  {/* Barcode placeholder (always shown) */}
                  {fields.barcode && (
                    <div
                      className="flex w-full items-center justify-center"
                      style={{ minHeight: '16px' }}
                    >
                      <div className="flex items-end gap-px">
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div
                            key={i}
                            className="bg-foreground"
                            style={{
                              width: i % 3 === 0 ? '2px' : '1px',
                              height: `${10 + (i % 4) * 2}px`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product Name */}
                  {fields.productName && (
                    <p
                      className={cn(
                        fontClasses.base,
                        'w-full truncate text-center font-semibold text-foreground',
                      )}
                    >
                      Product Name
                    </p>
                  )}

                  {/* SKU */}
                  {fields.sku && (
                    <p
                      className={cn(
                        fontClasses.small,
                        'w-full truncate text-center font-mono text-muted-foreground',
                      )}
                    >
                      SKU-001234
                    </p>
                  )}

                  {/* Size */}
                  {fields.size && (
                    <p
                      className={cn(
                        fontClasses.small,
                        'w-full truncate text-center text-muted-foreground',
                      )}
                    >
                      Size: M
                    </p>
                  )}

                  {/* Selling Price */}
                  {fields.sellingPrice && (
                    <p
                      className={cn(
                        fontClasses.base,
                        'w-full truncate text-center font-bold text-foreground',
                      )}
                    >
                      &#8377;499.00
                    </p>
                  )}

                  {/* MRP */}
                  {fields.mrp && (
                    <p
                      className={cn(
                        fontClasses.small,
                        'w-full truncate text-center text-muted-foreground line-through',
                      )}
                    >
                      MRP &#8377;699.00
                    </p>
                  )}

                  {/* Store Name */}
                  {fields.storeName && (
                    <p
                      className={cn(
                        fontClasses.small,
                        'mt-auto w-full truncate text-center text-muted-foreground',
                      )}
                    >
                      My Store
                    </p>
                  )}
                </div>
              </div>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Preview at {width}mm &times; {height}mm &middot; Font: {FONT_SIZE_MAP[fontSize].pt}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
