import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/layout';
import {
  useSettings,
  useUpdateSettings,
  useUpdateTenant,
} from '@/hooks/use-settings';
import { Store, Receipt, FileText } from 'lucide-react';

// ── Schemas ──

const storeProfileSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

const billingSettingsSchema = z.object({
  billNumberPrefix: z.string().min(1, 'Prefix is required').max(10, 'Max 10 characters'),
  defaultBillDiscountPct: z.number().min(0, 'Min 0%').max(100, 'Max 100%'),
  maxDiscountPct: z.number().min(0, 'Min 0%').max(100, 'Max 100%'),
  returnWindowDays: z.number().int().min(0, 'Min 0 days'),
  voidWindowHours: z.number().int().min(0, 'Min 0 hours'),
});

const receiptSettingsSchema = z.object({
  receiptFooterMessage: z.string().optional(),
  receiptShowReturnPolicy: z.boolean(),
});

type StoreProfileForm = z.infer<typeof storeProfileSchema>;
type BillingSettingsForm = z.infer<typeof billingSettingsSchema>;
type ReceiptSettingsForm = z.infer<typeof receiptSettingsSchema>;

// ── Loading Skeleton ──

function SettingsSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-24" />
    </div>
  );
}

// ── Store Profile Tab ──

function StoreProfileTab({
  data,
}: {
  data: { tenant: { name: string; address: string | null; phone: string | null; email: string | null } };
}) {
  const updateTenant = useUpdateTenant();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<StoreProfileForm>({
    resolver: zodResolver(storeProfileSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: '',
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        name: data.tenant.name,
        address: data.tenant.address ?? '',
        phone: data.tenant.phone ?? '',
        email: data.tenant.email ?? '',
      });
    }
  }, [data, reset]);

  const onSubmit = handleSubmit((values) => {
    updateTenant.mutate({
      name: values.name,
      address: values.address || null,
      phone: values.phone || null,
      email: values.email || null,
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Store className="size-5" />
          Store Profile
        </CardTitle>
        <CardDescription>
          Basic information about your store
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="store-name">Store Name *</Label>
            <Input
              id="store-name"
              placeholder="e.g. Kaushik Vastra Bhandar"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-error-500" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="store-address">Address</Label>
            <Textarea
              id="store-address"
              placeholder="Store address"
              rows={3}
              {...register('address')}
            />
          </div>

          <div className="grid gap-4 desktop:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="store-phone">Phone</Label>
              <Input
                id="store-phone"
                type="tel"
                placeholder="e.g. 9876543210"
                {...register('phone')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="store-email">Email</Label>
              <Input
                id="store-email"
                type="email"
                placeholder="store@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-error-500" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <Button
            type="submit"
            disabled={!isDirty || updateTenant.isPending}
            className="h-11 touch-target"
          >
            {updateTenant.isPending ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Billing Settings Tab ──

function BillingSettingsTab({
  data,
}: {
  data: {
    billNumberPrefix: string;
    defaultBillDiscountPct: string;
    maxDiscountPct: string;
    returnWindowDays: number;
    voidWindowHours: number;
  };
}) {
  const updateSettings = useUpdateSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<BillingSettingsForm>({
    resolver: zodResolver(billingSettingsSchema),
    defaultValues: {
      billNumberPrefix: '',
      defaultBillDiscountPct: 0,
      maxDiscountPct: 0,
      returnWindowDays: 0,
      voidWindowHours: 0,
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        billNumberPrefix: data.billNumberPrefix,
        defaultBillDiscountPct: parseFloat(data.defaultBillDiscountPct),
        maxDiscountPct: parseFloat(data.maxDiscountPct),
        returnWindowDays: data.returnWindowDays,
        voidWindowHours: data.voidWindowHours,
      });
    }
  }, [data, reset]);

  const onSubmit = handleSubmit((values) => {
    updateSettings.mutate({
      billNumberPrefix: values.billNumberPrefix,
      defaultBillDiscountPct: String(values.defaultBillDiscountPct),
      maxDiscountPct: String(values.maxDiscountPct),
      returnWindowDays: values.returnWindowDays,
      voidWindowHours: values.voidWindowHours,
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="size-5" />
          Billing Settings
        </CardTitle>
        <CardDescription>
          Configure billing defaults and limits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bill-prefix">Bill Number Prefix</Label>
            <Input
              id="bill-prefix"
              placeholder='e.g. "KVB"'
              {...register('billNumberPrefix')}
            />
            {errors.billNumberPrefix && (
              <p className="text-sm text-error-500" role="alert">
                {errors.billNumberPrefix.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 desktop:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="default-discount">Default Bill Discount %</Label>
              <Input
                id="default-discount"
                type="number"
                min={0}
                max={100}
                step="0.01"
                placeholder="0"
                {...register('defaultBillDiscountPct', { valueAsNumber: true })}
              />
              {errors.defaultBillDiscountPct && (
                <p className="text-sm text-error-500" role="alert">
                  {errors.defaultBillDiscountPct.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="max-discount">Max Discount Without Approval %</Label>
              <Input
                id="max-discount"
                type="number"
                min={0}
                max={100}
                step="0.01"
                placeholder="0"
                {...register('maxDiscountPct', { valueAsNumber: true })}
              />
              {errors.maxDiscountPct && (
                <p className="text-sm text-error-500" role="alert">
                  {errors.maxDiscountPct.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 desktop:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="return-window">Return Window (Days)</Label>
              <Input
                id="return-window"
                type="number"
                min={0}
                placeholder="7"
                {...register('returnWindowDays', { valueAsNumber: true })}
              />
              {errors.returnWindowDays && (
                <p className="text-sm text-error-500" role="alert">
                  {errors.returnWindowDays.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="void-window">Void Window (Hours)</Label>
              <Input
                id="void-window"
                type="number"
                min={0}
                placeholder="24"
                {...register('voidWindowHours', { valueAsNumber: true })}
              />
              {errors.voidWindowHours && (
                <p className="text-sm text-error-500" role="alert">
                  {errors.voidWindowHours.message}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <Button
            type="submit"
            disabled={!isDirty || updateSettings.isPending}
            className="h-11 touch-target"
          >
            {updateSettings.isPending ? 'Saving...' : 'Save Billing Settings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Receipt Settings Tab ──

function ReceiptSettingsTab({
  data,
}: {
  data: {
    receiptFooterMessage: string;
    receiptShowReturnPolicy: boolean;
  };
}) {
  const updateSettings = useUpdateSettings();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isDirty },
  } = useForm<ReceiptSettingsForm>({
    resolver: zodResolver(receiptSettingsSchema),
    defaultValues: {
      receiptFooterMessage: '',
      receiptShowReturnPolicy: true,
    },
  });

  const showReturnPolicy = watch('receiptShowReturnPolicy');

  useEffect(() => {
    if (data) {
      reset({
        receiptFooterMessage: data.receiptFooterMessage,
        receiptShowReturnPolicy: data.receiptShowReturnPolicy,
      });
    }
  }, [data, reset]);

  const onSubmit = handleSubmit((values) => {
    updateSettings.mutate({
      receiptFooterMessage: values.receiptFooterMessage ?? '',
      receiptShowReturnPolicy: values.receiptShowReturnPolicy,
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Receipt className="size-5" />
          Receipt Settings
        </CardTitle>
        <CardDescription>
          Customize what appears on printed receipts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="receipt-footer">Receipt Footer Message</Label>
            <Textarea
              id="receipt-footer"
              placeholder="e.g. Thank you for shopping with us!"
              rows={4}
              {...register('receiptFooterMessage')}
            />
            <p className="text-xs text-neutral-500">
              This message will appear at the bottom of every printed receipt.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="show-return-policy"
              checked={showReturnPolicy}
              onCheckedChange={(checked) =>
                setValue('receiptShowReturnPolicy', checked === true, {
                  shouldDirty: true,
                })
              }
            />
            <Label htmlFor="show-return-policy" className="cursor-pointer">
              Show return policy on receipt
            </Label>
          </div>

          <Separator />

          <Button
            type="submit"
            disabled={!isDirty || updateSettings.isPending}
            className="h-11 touch-target"
          >
            {updateSettings.isPending ? 'Saving...' : 'Save Receipt Settings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Main Page ──

export default function StoreSettingsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useSettings();

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Store Settings"
          showBack
          onBack={() => navigate('/settings')}
        />
        <SettingsSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <PageHeader
          title="Store Settings"
          showBack
          onBack={() => navigate('/settings')}
        />
        <div className="p-4 text-center text-neutral-500">
          Failed to load settings. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Store Settings"
        showBack
        onBack={() => navigate('/settings')}
      />

      <div className="px-4 pb-8 desktop:px-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6 w-full desktop:w-auto">
            <TabsTrigger value="profile" className="flex-1 desktop:flex-initial">
              Profile
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex-1 desktop:flex-initial">
              Billing
            </TabsTrigger>
            <TabsTrigger value="receipt" className="flex-1 desktop:flex-initial">
              Receipt
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <StoreProfileTab data={{ tenant: data.tenant }} />
          </TabsContent>

          <TabsContent value="billing">
            <BillingSettingsTab data={data} />
          </TabsContent>

          <TabsContent value="receipt">
            <ReceiptSettingsTab data={data} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
