import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';

import { PageHeader } from '@/components/layout';
import { PhoneInput } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

import {
  useCustomer,
  useCreateCustomer,
  useUpdateCustomer,
} from '@/hooks/use-customers';
import { phoneSchema, requiredString } from '@/lib/validators';

// ── Zod Schema ──

const customerSchema = z.object({
  name: requiredString,
  phone: phoneSchema,
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
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

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

export default function CustomerFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const { data: customer, isLoading: customerLoading } = useCustomer(id ?? '');
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer(id ?? '');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      gstin: '',
      notes: '',
    },
  });

  const phoneValue = watch('phone');

  // Pre-fill form in edit mode
  useEffect(() => {
    if (isEditMode && customer) {
      reset({
        name: customer.name,
        phone: customer.phone,
        email: customer.email ?? '',
        address: customer.address ?? '',
        gstin: customer.gstin ?? '',
        notes: '',
      });
    }
  }, [isEditMode, customer, reset]);

  const onSubmit = (data: CustomerFormValues) => {
    // Clean optional fields: empty strings become null
    const payload = {
      name: data.name,
      phone: data.phone,
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      gstin: data.gstin?.trim() || null,
      notes: data.notes?.trim() || null,
    };

    if (isEditMode) {
      updateMutation.mutate(payload, {
        onSuccess: () => navigate(`/customers/${id}`),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => navigate('/customers'),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditMode && customerLoading) {
    return (
      <div>
        <PageHeader title="Edit Customer" showBack />
        <FormSkeleton />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEditMode ? 'Edit Customer' : 'Add Customer'}
        showBack
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5 px-4 pb-8 desktop:max-w-xl desktop:px-6"
      >
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="customer-name">
            Name <span className="text-error-500">*</span>
          </Label>
          <Input
            id="customer-name"
            placeholder="Customer name"
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-xs text-error-500">{errors.name.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="customer-phone">
            Phone <span className="text-error-500">*</span>
          </Label>
          <PhoneInput
            value={phoneValue}
            onChange={(val) => setValue('phone', val, { shouldValidate: true })}
            error={errors.phone?.message}
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="customer-email">Email</Label>
          <Input
            id="customer-email"
            type="email"
            placeholder="customer@example.com"
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-error-500">{errors.email.message}</p>
          )}
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <Label htmlFor="customer-address">Address</Label>
          <Textarea
            id="customer-address"
            placeholder="Full address"
            rows={3}
            {...register('address')}
          />
        </div>

        {/* GSTIN */}
        <div className="space-y-1.5">
          <Label htmlFor="customer-gstin">GSTIN</Label>
          <Input
            id="customer-gstin"
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

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="customer-notes">Notes</Label>
          <Textarea
            id="customer-notes"
            placeholder="Optional notes about this customer..."
            rows={3}
            {...register('notes')}
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
              ? 'Update Customer'
              : 'Create Customer'}
        </Button>
      </form>
    </div>
  );
}
