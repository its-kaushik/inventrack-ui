import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { PhoneInput } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { useCreateCustomer } from '@/hooks/use-customers';
import { phoneSchema, requiredString } from '@/lib/validators';
import type { Customer } from '@/types/models';

// ── Schema ──

const quickAddSchema = z.object({
  name: requiredString,
  phone: phoneSchema,
});

type QuickAddFormValues = z.infer<typeof quickAddSchema>;

// ── Props ──

interface QuickAddCustomerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (customer: Customer) => void;
}

export function QuickAddCustomerSheet({
  open,
  onOpenChange,
  onCreated,
}: QuickAddCustomerSheetProps) {
  const createMutation = useCreateCustomer();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<QuickAddFormValues>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  });

  const phoneValue = watch('phone');

  const onSubmit = (data: QuickAddFormValues) => {
    createMutation.mutate(
      {
        name: data.name,
        phone: data.phone,
      },
      {
        onSuccess: (response) => {
          const newCustomer = response.data;
          reset();
          onOpenChange(false);
          onCreated(newCustomer);
        },
      },
    );
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Quick Add Customer</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 p-4 pt-0"
        >
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="quick-customer-name">
              Name <span className="text-error-500">*</span>
            </Label>
            <Input
              id="quick-customer-name"
              placeholder="Customer name"
              autoFocus
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-error-500">{errors.name.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="quick-customer-phone">
              Phone <span className="text-error-500">*</span>
            </Label>
            <PhoneInput
              value={phoneValue}
              onChange={(val) => setValue('phone', val, { shouldValidate: true })}
              error={errors.phone?.message}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Add Customer'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
