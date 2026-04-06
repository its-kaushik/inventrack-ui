import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Plus,
  Save,
  Printer,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { MultiSelectChips, ImagePicker } from '@/components/shared';
import { PageHeader } from '@/components/layout';
import { useIsMobile } from '@/hooks/use-media-query';
import {
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useCategories,
  useBrands,
  useCreateCategory,
  useCreateBrand,
} from '@/hooks/use-products';
import { VariantMatrixEditor, type VariantRow } from '@/features/products/components';
import type { CreateProductRequest } from '@/api/products.api';
import { formatINR } from '@/lib/currency';
import { cn } from '@/lib/cn';

// ── Constants ──

const COMMON_COLORS = [
  'Black', 'White', 'Blue', 'Red', 'Green', 'Navy',
  'Grey', 'Maroon', 'Brown', 'Pink', 'Yellow', 'Beige',
];

const SIZE_SYSTEMS = ['Letter', 'Numeric', 'Age-based', 'Free Size'] as const;
type SizeSystem = (typeof SIZE_SYSTEMS)[number];

const SIZE_OPTIONS: Record<SizeSystem, string[]> = {
  Letter: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'],
  Numeric: ['26', '28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48'],
  'Age-based': ['0-1Y', '1-2Y', '2-3Y', '3-4Y', '4-5Y', '6-7Y', '8-9Y', '10-12Y', '13-15Y'],
  'Free Size': [],
};

const COMMON_FABRICS = ['Cotton', 'Polyester', 'Silk', 'Wool', 'Linen', 'Rayon', 'Denim', 'Chiffon', 'Georgette', 'Crepe'];
const COMMON_PATTERNS = ['Solid', 'Striped', 'Checked', 'Printed', 'Floral', 'Paisley', 'Polka Dot', 'Abstract', 'Geometric'];
const COMMON_FITS = ['Regular', 'Slim', 'Relaxed', 'Oversized', 'Tailored', 'Loose'];

// ── Zod Schemas ──

const baseSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  brandId: z.string().min(1, 'Brand is required'),
  categoryId: z.string().min(1, 'Category is required'),
  hsnCode: z.string().optional(),
  description: z.string().optional(),
  productDiscountPct: z.number().min(0).max(100).optional(),
  gstRate: z.string().optional(),
  hasVariants: z.boolean(),
});

const simpleProductSchema = baseSchema.extend({
  hasVariants: z.literal(false),
  costPrice: z.number().positive('Cost price must be greater than 0'),
  mrp: z.number().positive('MRP must be greater than 0'),
  initialQuantity: z.number().int().min(0, 'Quantity must be 0 or more').optional(),
  lowStockThreshold: z.number().int().min(0).optional().nullable(),
}).refine((data) => data.mrp >= data.costPrice, {
  message: 'MRP must be greater than or equal to cost price',
  path: ['mrp'],
});

const variantProductSchema = baseSchema.extend({
  hasVariants: z.literal(true),
});

const formSchema = z.discriminatedUnion('hasVariants', [
  simpleProductSchema,
  variantProductSchema,
]);

type FormValues = z.infer<typeof formSchema>;

// ── Helpers ──

/** Generate cartesian product of attribute values. */
function cartesian(
  attrs: Record<string, string[]>,
): Record<string, string>[] {
  const keys = Object.keys(attrs).filter((k) => attrs[k].length > 0);
  if (keys.length === 0) return [];

  const result: Record<string, string>[] = [];

  function recurse(idx: number, current: Record<string, string>) {
    if (idx === keys.length) {
      result.push({ ...current });
      return;
    }
    const key = keys[idx];
    for (const val of attrs[key]) {
      current[key] = val;
      recurse(idx + 1, current);
    }
  }

  recurse(0, {});
  return result;
}

/** Create a unique key from an attributes record. */
function makeVariantKey(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .map(([k, v]) => `${k}:${v}`)
    .join('|');
}

/** Generate VariantRow array from selected attributes. */
function generateVariantRows(
  selectedColors: string[],
  selectedSizes: string[],
  selectedFabrics: string[],
  selectedPatterns: string[],
  selectedFits: string[],
  existingRows: VariantRow[],
): VariantRow[] {
  const attrs: Record<string, string[]> = {};
  if (selectedColors.length > 0) attrs['Color'] = selectedColors;
  if (selectedSizes.length > 0) attrs['Size'] = selectedSizes;
  if (selectedFabrics.length > 0) attrs['Fabric'] = selectedFabrics;
  if (selectedPatterns.length > 0) attrs['Pattern'] = selectedPatterns;
  if (selectedFits.length > 0) attrs['Fit'] = selectedFits;

  const combinations = cartesian(attrs);

  // Merge with existing rows to preserve user edits
  const existingMap = new Map(existingRows.map((r) => [r.key, r]));

  return combinations.map((combo) => {
    const key = makeVariantKey(combo);
    const existing = existingMap.get(key);
    if (existing) return existing;
    return {
      key,
      attributes: combo,
      included: true,
      costPrice: 0,
      mrp: 0,
      quantity: 0,
      lowStockThreshold: null,
    };
  });
}

// ── Step indicator ──

function StepIndicator({
  currentStep,
  totalSteps,
  labels,
}: {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      {labels.map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isComplete = stepNum < currentStep;

        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-center">
              <div
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  isComplete && 'bg-primary text-primary-foreground',
                  isActive && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                  !isComplete && !isActive && 'bg-neutral-200 text-neutral-500',
                )}
              >
                {isComplete ? <Check className="size-3.5" /> : stepNum}
              </div>
              {idx < labels.length - 1 && (
                <div
                  className={cn(
                    'mx-1 h-0.5 flex-1 rounded-full transition-colors',
                    isComplete ? 'bg-primary' : 'bg-neutral-200',
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                'text-[10px] leading-tight',
                isActive ? 'font-semibold text-foreground' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Inline "Add New" input ──

function InlineAddNew({
  label,
  onAdd,
  isPending,
}: {
  label: string;
  onAdd: (name: string) => void;
  isPending: boolean;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
      setValue('');
      setIsAdding(false);
    }
  };

  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={() => setIsAdding(true)}
        className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        <Plus className="size-3.5" />
        Add new {label}
      </button>
    );
  }

  return (
    <div className="mt-1 flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
          if (e.key === 'Escape') {
            setIsAdding(false);
            setValue('');
          }
        }}
        placeholder={`New ${label} name`}
        className="h-9 flex-1"
        autoFocus
      />
      <Button
        type="button"
        size="sm"
        onClick={handleSubmit}
        disabled={isPending || !value.trim()}
      >
        {isPending ? '...' : 'Add'}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setIsAdding(false);
          setValue('');
        }}
      >
        Cancel
      </Button>
    </div>
  );
}

// ── Loading skeleton ──

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// ── Main Component
// ══════════════════════════════════════════════════

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // ── Data fetching ──
  const { data: existingProduct, isLoading: isLoadingProduct } = useProduct(id ?? '');
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(id ?? '');
  const createCategory = useCreateCategory();
  const createBrand = useCreateBrand();

  // ── Mobile wizard state ──
  const [currentStep, setCurrentStep] = useState(1);

  // ── Variant attribute selections (managed outside react-hook-form) ──
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sizeSystem, setSizeSystem] = useState<SizeSystem>('Letter');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [selectedFits, setSelectedFits] = useState<string[]>([]);
  const [showAdditionalAttrs, setShowAdditionalAttrs] = useState(false);

  // ── Variant matrix rows ──
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);

  // ── Image state ──
  const [images, setImages] = useState<string[]>([]);

  // ── Form ──
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      brandId: '',
      categoryId: '',
      hsnCode: '',
      description: '',
      productDiscountPct: 0,
      gstRate: '',
      hasVariants: false,
      costPrice: 0,
      mrp: 0,
      initialQuantity: 0,
      lowStockThreshold: null,
    } as FormValues,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    trigger,
    formState: { errors },
  } = form;

  const hasVariants = watch('hasVariants');

  // ── Pre-fill form in edit mode ──
  useEffect(() => {
    if (!existingProduct) return;

    const p = existingProduct;
    reset({
      name: p.name,
      brandId: p.brandId ?? '',
      categoryId: p.categoryId,
      hsnCode: p.hsnCode ?? '',
      description: p.description ?? '',
      productDiscountPct: parseFloat(p.productDiscountPct) || 0,
      gstRate: p.gstRate ?? '',
      hasVariants: p.hasVariants,
      ...(p.hasVariants
        ? {}
        : {
            costPrice: parseFloat(p.defaultCostPrice ?? '0'),
            mrp: parseFloat(p.defaultMrp ?? '0'),
            initialQuantity: 0,
            lowStockThreshold: null,
          }),
    } as FormValues);
  }, [existingProduct, reset]);

  // ── Regenerate variant matrix when attribute selections change ──
  useEffect(() => {
    if (!hasVariants) return;
    const rows = generateVariantRows(
      selectedColors,
      selectedSizes,
      selectedFabrics,
      selectedPatterns,
      selectedFits,
      variantRows,
    );
    setVariantRows(rows);
    // intentionally exclude variantRows from deps to avoid infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasVariants, selectedColors, selectedSizes, selectedFabrics, selectedPatterns, selectedFits]);

  // When size system changes, clear selected sizes
  const handleSizeSystemChange = useCallback(
    (system: SizeSystem) => {
      setSizeSystem(system);
      setSelectedSizes([]);
    },
    [],
  );

  // ── Variant count ──
  const variantPreviewCount = useMemo(() => {
    let count = 1;
    if (selectedColors.length > 0) count *= selectedColors.length;
    if (selectedSizes.length > 0) count *= selectedSizes.length;
    if (selectedFabrics.length > 0) count *= selectedFabrics.length;
    if (selectedPatterns.length > 0) count *= selectedPatterns.length;
    if (selectedFits.length > 0) count *= selectedFits.length;
    // If nothing is selected, count should be 0
    const anySelected =
      selectedColors.length > 0 ||
      selectedSizes.length > 0 ||
      selectedFabrics.length > 0 ||
      selectedPatterns.length > 0 ||
      selectedFits.length > 0;
    return anySelected ? count : 0;
  }, [selectedColors, selectedSizes, selectedFabrics, selectedPatterns, selectedFits]);

  // ── Variant summary ──
  const variantSummary = useMemo(() => {
    const included = variantRows.filter((v) => v.included);
    return {
      count: included.length,
      totalUnits: included.reduce((s, v) => s + v.quantity, 0),
      totalCost: included.reduce((s, v) => s + v.costPrice * v.quantity, 0),
    };
  }, [variantRows]);

  // ── Step definitions ──
  const steps = hasVariants
    ? ['Basic Info', 'Attributes', 'Matrix', 'Review']
    : ['Basic Info'];
  const totalSteps = isMobile ? steps.length : 1;

  // ── Step validation for mobile wizard ──
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    if (currentStep === 1) {
      // Validate basic fields
      const fields: (keyof FormValues)[] = ['name', 'brandId', 'categoryId'];
      if (!hasVariants) {
        fields.push('costPrice' as keyof FormValues, 'mrp' as keyof FormValues);
      }
      return trigger(fields);
    }
    if (currentStep === 2 && hasVariants) {
      // Must have at least one attribute selected
      const anySelected =
        selectedColors.length > 0 ||
        selectedSizes.length > 0;
      if (!anySelected) {
        toast.error('Please select at least one color or size');
        return false;
      }
      return true;
    }
    if (currentStep === 3 && hasVariants) {
      // Must have at least one included variant with valid prices
      const included = variantRows.filter((v) => v.included);
      if (included.length === 0) {
        toast.error('At least one variant must be included');
        return false;
      }
      const invalid = included.find(
        (v) => v.costPrice <= 0 || v.mrp <= 0 || v.mrp < v.costPrice,
      );
      if (invalid) {
        toast.error('All included variants must have valid cost and MRP (MRP >= cost, both > 0)');
        return false;
      }
      return true;
    }
    return true;
  }, [currentStep, hasVariants, selectedColors, selectedSizes, trigger, variantRows]);

  const goNext = useCallback(async () => {
    const valid = await validateCurrentStep();
    if (valid && currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
    }
  }, [validateCurrentStep, currentStep, totalSteps]);

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    } else {
      navigate(-1);
    }
  }, [currentStep, navigate]);

  // ── Submit ──
  const onSubmit = useCallback(
    async (values: FormValues) => {
      if (isEditMode) {
        updateProduct.mutate(
          {
            name: values.name,
            brandId: values.brandId,
            categoryId: values.categoryId,
            hsnCode: values.hsnCode || null,
            description: values.description || null,
            productDiscountPct: values.productDiscountPct ?? 0,
            gstRate: values.gstRate || null,
          },
          {
            onSuccess: () => navigate(`/products/${id}`),
          },
        );
        return;
      }

      const payload: CreateProductRequest = {
        name: values.name,
        brandId: values.brandId,
        categoryId: values.categoryId,
        hsnCode: values.hsnCode || null,
        description: values.description || null,
        hasVariants: values.hasVariants,
        productDiscountPct: values.productDiscountPct ?? 0,
        gstRate: values.gstRate || null,
      };

      if (values.hasVariants) {
        const included = variantRows.filter((v) => v.included);
        if (included.length === 0) {
          toast.error('At least one variant must be included');
          return;
        }
        const invalid = included.find(
          (v) => v.costPrice <= 0 || v.mrp <= 0 || v.mrp < v.costPrice,
        );
        if (invalid) {
          toast.error('All included variants must have valid cost and MRP');
          return;
        }
        payload.variants = included.map((v) => ({
          attributes: v.attributes,
          costPrice: v.costPrice,
          mrp: v.mrp,
          initialQuantity: v.quantity,
          lowStockThreshold: v.lowStockThreshold,
        }));
      } else {
        payload.costPrice = (values as z.infer<typeof simpleProductSchema>).costPrice;
        payload.mrp = (values as z.infer<typeof simpleProductSchema>).mrp;
        payload.initialQuantity = (values as z.infer<typeof simpleProductSchema>).initialQuantity ?? 0;
        payload.lowStockThreshold = (values as z.infer<typeof simpleProductSchema>).lowStockThreshold ?? null;
      }

      createProduct.mutate(payload, {
        onSuccess: (res) => {
          navigate(`/products/${res.data.id}`);
        },
      });
    },
    [isEditMode, id, variantRows, createProduct, updateProduct, navigate],
  );

  const onSubmitAndPrint = useCallback(async () => {
    const valid = await trigger();
    if (!valid) return;

    // Validate variants if applicable
    if (hasVariants) {
      const included = variantRows.filter((v) => v.included);
      if (included.length === 0) {
        toast.error('At least one variant must be included');
        return;
      }
      const invalid = included.find(
        (v) => v.costPrice <= 0 || v.mrp <= 0 || v.mrp < v.costPrice,
      );
      if (invalid) {
        toast.error('All included variants must have valid cost and MRP');
        return;
      }
    }

    const values = form.getValues();

    const payload: CreateProductRequest = {
      name: values.name,
      brandId: values.brandId,
      categoryId: values.categoryId,
      hsnCode: values.hsnCode || null,
      description: values.description || null,
      hasVariants: values.hasVariants,
      productDiscountPct: values.productDiscountPct ?? 0,
      gstRate: values.gstRate || null,
    };

    if (values.hasVariants) {
      const included = variantRows.filter((v) => v.included);
      payload.variants = included.map((v) => ({
        attributes: v.attributes,
        costPrice: v.costPrice,
        mrp: v.mrp,
        initialQuantity: v.quantity,
        lowStockThreshold: v.lowStockThreshold,
      }));
    } else {
      const simple = values as z.infer<typeof simpleProductSchema>;
      payload.costPrice = simple.costPrice;
      payload.mrp = simple.mrp;
      payload.initialQuantity = simple.initialQuantity ?? 0;
      payload.lowStockThreshold = simple.lowStockThreshold ?? null;
    }

    createProduct.mutate(payload, {
      onSuccess: (res) => {
        toast.success('Product created — preparing labels...');
        navigate(`/products/${res.data.id}?print=labels`);
      },
    });
  }, [trigger, hasVariants, variantRows, form, createProduct, navigate]);

  // ── Handle creating brand/category inline ──
  const handleCreateBrand = useCallback(
    (name: string) => {
      createBrand.mutate(
        { name },
        {
          onSuccess: (res) => {
            setValue('brandId', res.data.id, { shouldValidate: true });
          },
        },
      );
    },
    [createBrand, setValue],
  );

  const handleCreateCategory = useCallback(
    (name: string) => {
      createCategory.mutate(
        { name },
        {
          onSuccess: (res) => {
            setValue('categoryId', res.data.id, { shouldValidate: true });
          },
        },
      );
    },
    [createCategory, setValue],
  );

  // ── Loading state ──
  if (isEditMode && isLoadingProduct) {
    return (
      <div>
        <PageHeader
          title="Edit Product"
          showBack
          onBack={() => navigate('/products')}
        />
        <FormSkeleton />
      </div>
    );
  }

  if (isEditMode && !existingProduct) {
    return (
      <div>
        <PageHeader
          title="Edit Product"
          showBack
          onBack={() => navigate('/products')}
        />
        <div className="p-4 text-center text-neutral-500">
          Product not found.
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════
  // ── Render sections
  // ══════════════════════════════════════════════════

  const basicInfoSection = (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-2">
        <h2 className="text-base font-semibold text-foreground">Basic Info</h2>

        {/* Product Name */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-name">Product Name *</Label>
          <Input
            id="product-name"
            placeholder="e.g. Men's Cotton Kurta"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-error-500" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Brand */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-brand">Brand *</Label>
          <Controller
            name="brandId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full" id="product-brand">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.brandId && (
            <p className="text-sm text-error-500" role="alert">
              {errors.brandId.message}
            </p>
          )}
          <InlineAddNew
            label="brand"
            onAdd={handleCreateBrand}
            isPending={createBrand.isPending}
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-category">Category *</Label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full" id="product-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.categoryId && (
            <p className="text-sm text-error-500" role="alert">
              {errors.categoryId.message}
            </p>
          )}
          <InlineAddNew
            label="category"
            onAdd={handleCreateCategory}
            isPending={createCategory.isPending}
          />
        </div>

        {/* HSN Code */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-hsn">HSN Code</Label>
          <Input
            id="product-hsn"
            placeholder="e.g. 6109"
            {...register('hsnCode')}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-desc">Description</Label>
          <Textarea
            id="product-desc"
            placeholder="Optional product description"
            rows={3}
            {...register('description')}
          />
        </div>

        {/* Product Discount % */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-discount">Product Discount %</Label>
          <Input
            id="product-discount"
            type="number"
            min={0}
            max={100}
            step="0.01"
            placeholder="0"
            {...register('productDiscountPct', { valueAsNumber: true })}
          />
        </div>

        {/* GST Rate */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-gst">GST Rate</Label>
          <Controller
            name="gstRate"
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger className="w-full" id="product-gst">
                  <SelectValue placeholder="Select GST rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="12">12%</SelectItem>
                  <SelectItem value="18">18%</SelectItem>
                  <SelectItem value="28">28%</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Image Picker */}
        <div className="flex flex-col gap-1.5">
          <Label>Images</Label>
          <ImagePicker images={images} onChange={setImages} maxImages={5} />
        </div>

        <Separator />

        {/* Has Variants Toggle */}
        {!isEditMode && (
          <div className="flex items-center gap-3">
            <Controller
              name="hasVariants"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="has-variants"
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked === true);
                    // Reset step to 1 when toggling
                    setCurrentStep(1);
                  }}
                />
              )}
            />
            <Label htmlFor="has-variants" className="cursor-pointer">
              This product has variants (colors, sizes, etc.)
            </Label>
          </div>
        )}

        {isEditMode && existingProduct && (
          <p className="text-sm text-muted-foreground">
            {existingProduct.hasVariants
              ? 'This is a variant product. Manage variants from the product detail page.'
              : 'This is a simple product.'}
          </p>
        )}

        {/* Simple product pricing fields */}
        {!hasVariants && !isEditMode && (
          <>
            <Separator />
            <h3 className="text-sm font-semibold text-foreground">Pricing & Stock</h3>

            <div className="grid gap-4 desktop:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cost-price">Cost Price *</Label>
                <Input
                  id="cost-price"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  {...register('costPrice' as 'name', { valueAsNumber: true })}
                />
                {'costPrice' in errors && errors.costPrice && (
                  <p className="text-sm text-error-500" role="alert">
                    {errors.costPrice.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="mrp">MRP *</Label>
                <Input
                  id="mrp"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  {...register('mrp' as 'name', { valueAsNumber: true })}
                />
                {'mrp' in errors && errors.mrp && (
                  <p className="text-sm text-error-500" role="alert">
                    {errors.mrp.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 desktop:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="initial-qty">Initial Quantity</Label>
                <Input
                  id="initial-qty"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="0"
                  {...register('initialQuantity' as 'name', { valueAsNumber: true })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="low-stock">Low Stock Threshold</Label>
                <Input
                  id="low-stock"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="e.g. 5"
                  {...register('lowStockThreshold' as 'name', {
                    setValueAs: (v: string) => (v === '' ? null : parseInt(v, 10)),
                  })}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const variantAttributesSection = hasVariants && (
    <Card>
      <CardContent className="flex flex-col gap-5 pt-2">
        <h2 className="text-base font-semibold text-foreground">
          Variant Attributes
        </h2>

        {/* Colors */}
        <div className="flex flex-col gap-2">
          <Label>Colors</Label>
          <MultiSelectChips
            options={COMMON_COLORS}
            selected={selectedColors}
            onChange={setSelectedColors}
            allowCustom
            placeholder="Custom color..."
          />
        </div>

        <Separator />

        {/* Size System */}
        <div className="flex flex-col gap-2">
          <Label>Size System</Label>
          <Select
            value={sizeSystem}
            onValueChange={(val) => handleSizeSystemChange(val as SizeSystem)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIZE_SYSTEMS.map((sys) => (
                <SelectItem key={sys} value={sys}>
                  {sys}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Size selections */}
        {sizeSystem !== 'Free Size' && (
          <div className="flex flex-col gap-2">
            <Label>Sizes</Label>
            <MultiSelectChips
              options={SIZE_OPTIONS[sizeSystem]}
              selected={selectedSizes}
              onChange={setSelectedSizes}
              allowCustom
              placeholder="Custom size..."
            />
          </div>
        )}
        {sizeSystem === 'Free Size' && (
          <p className="text-sm text-muted-foreground">
            Free size — no size selection needed.
          </p>
        )}

        <Separator />

        {/* Additional attributes accordion */}
        <button
          type="button"
          onClick={() => setShowAdditionalAttrs((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ChevronRight
            className={cn(
              'size-4 transition-transform',
              showAdditionalAttrs && 'rotate-90',
            )}
          />
          Additional attributes (Fabric, Pattern, Fit)
        </button>

        {showAdditionalAttrs && (
          <div className="flex flex-col gap-5 pl-2">
            {/* Fabric */}
            <div className="flex flex-col gap-2">
              <Label>Fabric</Label>
              <MultiSelectChips
                options={COMMON_FABRICS}
                selected={selectedFabrics}
                onChange={setSelectedFabrics}
                allowCustom
                placeholder="Custom fabric..."
              />
            </div>

            {/* Pattern */}
            <div className="flex flex-col gap-2">
              <Label>Pattern</Label>
              <MultiSelectChips
                options={COMMON_PATTERNS}
                selected={selectedPatterns}
                onChange={setSelectedPatterns}
                allowCustom
                placeholder="Custom pattern..."
              />
            </div>

            {/* Fit */}
            <div className="flex flex-col gap-2">
              <Label>Fit</Label>
              <MultiSelectChips
                options={COMMON_FITS}
                selected={selectedFits}
                onChange={setSelectedFits}
                allowCustom
                placeholder="Custom fit..."
              />
            </div>
          </div>
        )}

        {/* Preview count */}
        <div className="rounded-lg border bg-muted/50 px-3 py-2.5 text-sm">
          {variantPreviewCount > 0 ? (
            <span>
              This will generate{' '}
              <span className="font-semibold text-foreground">
                {variantPreviewCount}
              </span>{' '}
              variants
            </span>
          ) : (
            <span className="text-muted-foreground">
              Select at least one attribute to generate variants
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const variantMatrixSection = hasVariants && (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-2">
        <h2 className="text-base font-semibold text-foreground">
          Variant Pricing & Stock
        </h2>

        {variantRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No variants generated. Go back and select attributes.
          </p>
        ) : (
          <VariantMatrixEditor
            variants={variantRows}
            onChange={isEditMode ? () => {} : setVariantRows}
          />
        )}
      </CardContent>
    </Card>
  );

  const reviewSection = hasVariants && (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-2">
        <h2 className="text-base font-semibold text-foreground">
          Review & Save
        </h2>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Product Name</span>
            <span className="font-medium">{watch('name') || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Brand</span>
            <span className="font-medium">
              {brands.find((b) => b.id === watch('brandId'))?.name || '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Category</span>
            <span className="font-medium">
              {categories.find((c) => c.id === watch('categoryId'))?.name || '—'}
            </span>
          </div>

          <Separator />

          <div className="flex justify-between">
            <span className="text-muted-foreground">Variants</span>
            <span className="font-medium">{variantSummary.count}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Units</span>
            <span className="font-medium">{variantSummary.totalUnits}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Cost</span>
            <span className="font-medium">{formatINR(variantSummary.totalCost)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 desktop:flex-row">
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={createProduct.isPending}
            className="h-11 flex-1 touch-target"
          >
            <Save className="size-4" data-icon="inline-start" />
            {createProduct.isPending ? 'Saving...' : 'Save Product'}
          </Button>

          {!isEditMode && (
            <Button
              type="button"
              variant="outline"
              onClick={onSubmitAndPrint}
              disabled={createProduct.isPending}
              className="h-11 flex-1 touch-target"
            >
              <Printer className="size-4" data-icon="inline-start" />
              Save & Print Labels
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // ══════════════════════════════════════════════════
  // ── Mobile Wizard Layout
  // ══════════════════════════════════════════════════

  if (isMobile) {
    const renderMobileStep = () => {
      if (!hasVariants) {
        // Simple product: only step 1
        return basicInfoSection;
      }

      switch (currentStep) {
        case 1:
          return basicInfoSection;
        case 2:
          return variantAttributesSection;
        case 3:
          return variantMatrixSection;
        case 4:
          return reviewSection;
        default:
          return basicInfoSection;
      }
    };

    return (
      <div className="flex min-h-dvh flex-col">
        <PageHeader
          title={isEditMode ? 'Edit Product' : 'New Product'}
          showBack
          onBack={goBack}
        />

        {/* Step indicator for variant mode */}
        {hasVariants && (
          <StepIndicator
            currentStep={currentStep}
            totalSteps={steps.length}
            labels={steps}
          />
        )}

        {/* Step content */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col px-4 pb-4"
        >
          <div className="flex-1">{renderMobileStep()}</div>

          {/* Bottom navigation */}
          <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-3 border-t bg-background px-4 py-3">
            {hasVariants && currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                className="h-11 touch-target"
              >
                <ChevronLeft className="size-4" data-icon="inline-start" />
                Back
              </Button>
            )}

            <div className="flex-1" />

            {/* Simple mode: Save button on step 1 */}
            {!hasVariants && (
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createProduct.isPending || updateProduct.isPending}
                  className="h-11 touch-target"
                >
                  <Save className="size-4" data-icon="inline-start" />
                  {createProduct.isPending || updateProduct.isPending
                    ? 'Saving...'
                    : isEditMode
                      ? 'Update'
                      : 'Save'}
                </Button>

                {!isEditMode && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onSubmitAndPrint}
                    disabled={createProduct.isPending}
                    className="h-11 touch-target"
                  >
                    <Printer className="size-4" data-icon="inline-start" />
                    Save & Print
                  </Button>
                )}
              </div>
            )}

            {/* Variant mode: Next button (except last step, which has Save in review) */}
            {hasVariants && currentStep < steps.length && (
              <Button
                type="button"
                onClick={goNext}
                className="h-11 touch-target"
              >
                Next
                <ChevronRight className="size-4" data-icon="inline-end" />
              </Button>
            )}

            {/* Edit mode on variant step 1 */}
            {isEditMode && hasVariants && currentStep === 1 && (
              <Button
                type="submit"
                disabled={updateProduct.isPending}
                className="h-11 touch-target"
              >
                <Save className="size-4" data-icon="inline-start" />
                {updateProduct.isPending ? 'Saving...' : 'Update'}
              </Button>
            )}
          </div>
        </form>
      </div>
    );
  }

  // ══════════════════════════════════════════════════
  // ── Desktop Scrollable Layout
  // ══════════════════════════════════════════════════

  return (
    <div>
      <PageHeader
        title={isEditMode ? 'Edit Product' : 'New Product'}
        showBack
        onBack={() => navigate('/products')}
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 px-6 pb-8"
      >
        {/* All sections visible on desktop */}
        {basicInfoSection}

        {hasVariants && !isEditMode && variantAttributesSection}

        {hasVariants && !isEditMode && variantMatrixSection}

        {/* Desktop save bar */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={createProduct.isPending || updateProduct.isPending}
            className="h-11 touch-target"
          >
            <Save className="size-4" data-icon="inline-start" />
            {createProduct.isPending || updateProduct.isPending
              ? 'Saving...'
              : isEditMode
                ? 'Update Product'
                : 'Save Product'}
          </Button>

          {!isEditMode && (
            <Button
              type="button"
              variant="outline"
              onClick={onSubmitAndPrint}
              disabled={createProduct.isPending}
              className="h-11 touch-target"
            >
              <Printer className="size-4" data-icon="inline-start" />
              Save & Print Labels
            </Button>
          )}
        </div>

        {/* Desktop review summary (variant mode only) */}
        {hasVariants && !isEditMode && variantRows.length > 0 && (
          <Card>
            <CardContent className="pt-2">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {variantSummary.count}
                  </span>{' '}
                  variants selected
                </span>
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {variantSummary.totalUnits}
                  </span>{' '}
                  total units
                </span>
                <span className="text-muted-foreground">
                  Total cost:{' '}
                  <span className="font-semibold text-foreground">
                    {formatINR(variantSummary.totalCost)}
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
