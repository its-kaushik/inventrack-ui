import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';

import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useSupplier,
  useCreateSupplier,
  useUpdateSupplier,
} from '@/hooks/use-suppliers';

// ── Constants ──

const PAYMENT_TERMS_OPTIONS = [
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'net_15', label: 'Net 15 Days' },
  { value: 'net_30', label: 'Net 30 Days' },
  { value: 'net_60', label: 'Net 60 Days' },
  { value: 'advance', label: 'Advance' },
] as const;

// ── Zod Schema ──

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contactPerson: z.string().optional(),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{10}$/.test(val),
      'Phone must be a 10-digit number',
    ),
  email: z
    .string()
    .optional()
    .refine(
      (val) => !val || z.string().email().safeParse(val).success,
      'Invalid email address',
    ),
  address: z.string().optional(),
  gstin: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val),
      'Invalid GSTIN format (15 characters)',
    ),
  pan: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val),
      'Invalid PAN format (10 characters)',
    ),
  paymentTerms: z.enum(['cod', 'net_15', 'net_30', 'net_60', 'advance']).optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

// ── Loading Skeleton ──

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 pb-8 desktop:px-6" aria-busy="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  );
}

// ── Main Page ──

export default function SupplierFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const { data: supplier, isLoading: supplierLoading } = useSupplier(id ?? '');
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier(id ?? '');

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      gstin: '',
      pan: '',
      paymentTerms: 'net_30',
    },
  });

  // Pre-fill form in edit mode
  useEffect(() => {
    if (isEditMode && supplier) {
      reset({
        name: supplier.name,
        contactPerson: supplier.contactPerson ?? '',
        phone: supplier.phone ?? '',
        email: supplier.email ?? '',
        address: supplier.address ?? '',
        gstin: supplier.gstin ?? '',
        pan: supplier.pan ?? '',
        paymentTerms: supplier.paymentTerms ?? 'net_30',
      });
    }
  }, [isEditMode, supplier, reset]);

  const onSubmit = (data: SupplierFormValues) => {
    // Clean optional fields: empty strings become null
    const payload = {
      name: data.name,
      contactPerson: data.contactPerson?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      gstin: data.gstin?.trim() || null,
      pan: data.pan?.trim() || null,
      paymentTerms: data.paymentTerms,
    };

    if (isEditMode) {
      updateMutation.mutate(payload, {
        onSuccess: () => navigate(`/suppliers/${id}`),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => navigate('/suppliers'),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditMode && supplierLoading) {
    return (
      <div>
        <PageHeader title="Edit Supplier" showBack />
        <FormSkeleton />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEditMode ? 'Edit Supplier' : 'Add Supplier'}
        showBack
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5 px-4 pb-8 desktop:max-w-xl desktop:px-6"
      >
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="supplier-name">
            Name <span className="text-error-500">*</span>
          </Label>
          <Input
            id="supplier-name"
            placeholder="Supplier name"
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-xs text-error-500">{errors.name.message}</p>
          )}
        </div>

        {/* Contact Person */}
        <div className="space-y-1.5">
          <Label htmlFor="supplier-contact">Contact Person</Label>
          <Input
            id="supplier-contact"
            placeholder="Contact person name"
            {...register('contactPerson')}
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="supplier-phone">Phone</Label>
          <Input
            id="supplier-phone"
            type="tel"
            inputMode="numeric"
            placeholder="10-digit phone number"
            maxLength={10}
            {...register('phone')}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && (
            <p className="text-xs text-error-500">{errors.phone.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="supplier-email">Email</Label>
          <Input
            id="supplier-email"
            type="email"
            placeholder="supplier@example.com"
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-error-500">{errors.email.message}</p>
          )}
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <Label htmlFor="supplier-address">Address</Label>
          <Textarea
            id="supplier-address"
            placeholder="Full address"
            rows={3}
            {...register('address')}
          />
        </div>

        {/* GSTIN */}
        <div className="space-y-1.5">
          <Label htmlFor="supplier-gstin">GSTIN</Label>
          <Input
            id="supplier-gstin"
            placeholder="e.g. 22AAAAA0000A1Z5"
            maxLength={15}
            className="font-mono uppercase"
            {...register('gstin')}
            aria-invalid={!!errors.gstin}
          />
          {errors.gstin && (
            <p className="text-xs text-error-500">{errors.gstin.message}</p>
          )}
        </div>

        {/* PAN */}
        <div className="space-y-1.5">
          <Label htmlFor="supplier-pan">PAN</Label>
          <Input
            id="supplier-pan"
            placeholder="e.g. ABCDE1234F"
            maxLength={10}
            className="font-mono uppercase"
            {...register('pan')}
            aria-invalid={!!errors.pan}
          />
          {errors.pan && (
            <p className="text-xs text-error-500">{errors.pan.message}</p>
          )}
        </div>

        {/* Payment Terms */}
        <div className="space-y-1.5">
          <Label htmlFor="supplier-terms">Payment Terms</Label>
          <Controller
            name="paymentTerms"
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger className="w-full" id="supplier-terms">
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          className="mt-2 w-full"
          disabled={isPending || isSubmitting}
        >
          {isPending
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
              ? 'Update Supplier'
              : 'Create Supplier'}
        </Button>
      </form>
    </div>
  );
}
