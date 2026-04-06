import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Printer, Plus, Trash2, Package, Search } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout';
import { BarcodeInput, NumberStepper, EmptyState, PrintActionSheet } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { LabelPreview } from './LabelPreview';
import { useLabelTemplates, useGenerateLabelPdf } from '@/hooks/use-labels';
import { useSettings } from '@/hooks/use-settings';
import { productsApi } from '@/api/products.api';
import { formatINR } from '@/lib/currency';
import type { LabelItem } from '@/api/labels.api';

// ── Types ──

interface LabelRow extends LabelItem {
  /** unique key for list rendering */
  key: string;
}

// ── Default label sizes (fallback if API not available) ──

const DEFAULT_TEMPLATES = [
  { id: 'thermal-50x25', name: 'Thermal 50×25mm', widthMm: 50, heightMm: 25, description: 'Standard thermal label' },
  { id: 'thermal-50x30', name: 'Thermal 50×30mm', widthMm: 50, heightMm: 30, description: 'Tall thermal label' },
  { id: 'thermal-38x25', name: 'Thermal 38×25mm', widthMm: 38, heightMm: 25, description: 'Small thermal label' },
  { id: 'a4-sheet', name: 'A4 Sheet (30 labels)', widthMm: 63, heightMm: 29, description: '3 columns × 10 rows' },
];

export default function LabelPrintPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Label items
  const [items, setItems] = useState<LabelRow[]>(() => {
    // Pre-populate from query params if coming from goods receipt or product detail
    const preload = searchParams.get('items');
    if (preload) {
      try {
        const parsed = JSON.parse(decodeURIComponent(preload)) as LabelRow[];
        return parsed.map((item) => ({ ...item, key: item.variantId }));
      } catch {
        return [];
      }
    }
    return [];
  });

  // Template selection
  const { data: apiTemplates } = useLabelTemplates();
  const templates = apiTemplates && apiTemplates.length > 0 ? apiTemplates : DEFAULT_TEMPLATES;
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? 'thermal-50x25');
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? templates[0];

  // Print
  const [printSheetOpen, setPrintSheetOpen] = useState(false);
  const generatePdf = useGenerateLabelPdf();

  // Settings for store name
  const { data: settings } = useSettings();
  const storeName = settings?.tenant?.name ?? 'InvenTrack';

  // Total label count
  const totalLabels = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  // ── Add item by barcode scan ──
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    // Check if already in list
    const existing = items.find((i) => i.barcode === barcode);
    if (existing) {
      setItems((prev) =>
        prev.map((i) => (i.barcode === barcode ? { ...i, quantity: i.quantity + 1 } : i)),
      );
      toast.success(`Increased quantity for ${existing.productName}`);
      return;
    }

    // Lookup product by barcode
    try {
      const res = await productsApi.list({ search: barcode, limit: 1 });
      if (res.data.length === 0) {
        toast.error('Product not found for this barcode');
        return;
      }
      const product = res.data[0];
      const detail = await productsApi.get(product.id);
      const variant = detail.data.variants.find((v) => v.barcode === barcode);
      if (!variant) {
        toast.error('Variant not found for this barcode');
        return;
      }

      const newItem: LabelRow = {
        key: variant.id,
        variantId: variant.id,
        productName: product.name,
        variantDescription: Object.values(variant.attributes ?? {}).join(' · '),
        sku: variant.sku,
        barcode: variant.barcode,
        mrp: parseFloat(variant.mrp),
        quantity: 1,
      };
      setItems((prev) => [...prev, newItem]);
      toast.success(`Added ${product.name}`);
    } catch {
      toast.error('Failed to look up product');
    }
  }, [items]);

  // ── Update quantity ──
  const updateQuantity = useCallback((key: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.key !== key));
    } else {
      setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity: qty } : i)));
    }
  }, []);

  // ── Remove item ──
  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  // ── Print actions ──
  const handleBrowserPrint = useCallback(() => {
    setPrintSheetOpen(false);
    window.print();
  }, []);

  const handleDownloadPdf = useCallback(() => {
    if (!selectedTemplate || items.length === 0) return;
    setPrintSheetOpen(false);
    generatePdf.mutate({
      templateId: selectedTemplate.id,
      items: items.map(({ key, ...rest }) => rest),
    });
  }, [selectedTemplate, items, generatePdf]);

  return (
    <div className="space-y-4 p-4 desktop:p-6">
      <PageHeader
        title="Print Labels"
        showBack
        action={
          items.length > 0
            ? { label: 'Print / Share', onClick: () => setPrintSheetOpen(true), icon: Printer }
            : undefined
        }
      />

      {/* Template selection */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-neutral-700 whitespace-nowrap">Label Size:</label>
            <Select
              value={selectedTemplateId}
              onValueChange={(val) => setSelectedTemplateId(val ?? templates[0]?.id ?? '')}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Add items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Add Items</CardTitle>
        </CardHeader>
        <CardContent>
          <BarcodeInput
            onSubmit={handleBarcodeScan}
            placeholder="Scan barcode or search product..."
          />
        </CardContent>
      </Card>

      {/* Items list */}
      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No items added"
          description="Scan a barcode or search to add products for label printing."
        />
      ) : (
        <div className="space-y-3">
          {/* Summary */}
          <div className="flex items-center justify-between rounded-btn bg-primary-50 px-4 py-2">
            <span className="text-sm font-medium text-primary-700">
              {items.length} item{items.length !== 1 ? 's' : ''} · {totalLabels} label{totalLabels !== 1 ? 's' : ''}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrintSheetOpen(true)}
              disabled={generatePdf.isPending}
            >
              <Printer className="size-4" data-icon="inline-start" />
              Print
            </Button>
          </div>

          {/* Item rows */}
          {items.map((item) => (
            <Card key={item.key}>
              <CardContent className="py-3">
                <div className="flex items-start gap-3">
                  {/* Label preview thumbnail */}
                  <div className="hidden shrink-0 desktop:block">
                    <LabelPreview
                      storeName={storeName}
                      productName={item.productName}
                      variantDescription={item.variantDescription}
                      barcode={item.barcode}
                      mrp={item.mrp}
                      widthMm={selectedTemplate?.widthMm}
                      heightMm={selectedTemplate?.heightMm}
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-800 truncate">{item.productName}</p>
                    {item.variantDescription && (
                      <p className="text-xs text-neutral-500">{item.variantDescription}</p>
                    )}
                    <p className="mt-0.5 text-xs text-neutral-400">
                      SKU: {item.sku} · MRP: {formatINR(item.mrp)}
                    </p>

                    {/* Quantity */}
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-xs text-neutral-500">Qty:</span>
                      <NumberStepper
                        value={item.quantity}
                        onChange={(qty) => updateQuantity(item.key, qty)}
                        min={1}
                        max={999}
                      />
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="shrink-0 rounded-btn p-2 text-neutral-400 hover:bg-error-50 hover:text-error-600 touch-target"
                    aria-label={`Remove ${item.productName}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview section (desktop only) */}
      {items.length > 0 && selectedTemplate && (
        <Card className="hidden desktop:block print:block">
          <CardHeader>
            <CardTitle className="text-base">Label Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {items.slice(0, 6).map((item) => (
                <LabelPreview
                  key={item.key}
                  storeName={storeName}
                  productName={item.productName}
                  variantDescription={item.variantDescription}
                  barcode={item.barcode}
                  mrp={item.mrp}
                  widthMm={selectedTemplate.widthMm}
                  heightMm={selectedTemplate.heightMm}
                />
              ))}
              {items.length > 6 && (
                <div className="flex items-center justify-center rounded border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-500">
                  +{totalLabels - 6} more labels
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Print action sheet */}
      <PrintActionSheet
        open={printSheetOpen}
        onOpenChange={setPrintSheetOpen}
        onPrint={handleBrowserPrint}
        onDownloadPDF={handleDownloadPdf}
      />
    </div>
  );
}
