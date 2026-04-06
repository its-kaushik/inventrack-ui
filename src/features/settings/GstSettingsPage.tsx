import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/shared';
import { PageHeader } from '@/components/layout';
import { useGstConfig, useUpdateGstConfig } from '@/hooks/use-settings';
import { AlertTriangle, IndianRupee } from 'lucide-react';
import type { GstScheme } from '@/types/enums';

// ── Schema ──

const gstFormSchema = z.object({
  gstin: z
    .string()
    .regex(/^[0-9A-Z]{15}$/, 'GSTIN must be exactly 15 alphanumeric characters')
    .or(z.literal('')),
  stateCode: z
    .string()
    .regex(/^[0-9]{2}$/, 'State code must be 2 digits')
    .or(z.literal('')),
});

type GstFormData = z.infer<typeof gstFormSchema>;

// ── Loading Skeleton ──

function GstSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-6 w-32" />
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-24" />
    </div>
  );
}

// ── Main Page ──

export default function GstSettingsPage() {
  const navigate = useNavigate();
  const { data: gstConfig, isLoading } = useGstConfig();
  const updateGst = useUpdateGstConfig();
  const [showSchemeDialog, setShowSchemeDialog] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<GstFormData>({
    resolver: zodResolver(gstFormSchema),
    defaultValues: {
      gstin: '',
      stateCode: '',
    },
  });

  useEffect(() => {
    if (gstConfig) {
      reset({
        gstin: gstConfig.gstin ?? '',
        stateCode: gstConfig.stateCode ?? '',
      });
    }
  }, [gstConfig, reset]);

  const currentScheme = gstConfig?.gstScheme ?? 'composite';
  const targetScheme: GstScheme = currentScheme === 'composite' ? 'regular' : 'composite';

  const onSaveGstInfo = handleSubmit((values) => {
    updateGst.mutate({
      gstin: values.gstin || null,
      stateCode: values.stateCode || null,
    });
  });

  const handleSwitchScheme = () => {
    updateGst.mutate(
      { gstScheme: targetScheme },
      { onSuccess: () => setShowSchemeDialog(false) },
    );
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="GST Settings"
          showBack
          onBack={() => navigate('/settings')}
        />
        <GstSkeleton />
      </div>
    );
  }

  if (!gstConfig) {
    return (
      <div>
        <PageHeader
          title="GST Settings"
          showBack
          onBack={() => navigate('/settings')}
        />
        <div className="p-4 text-center text-neutral-500">
          Failed to load GST settings. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="GST Settings"
        showBack
        onBack={() => navigate('/settings')}
      />

      <div className="space-y-6 px-4 pb-8 desktop:px-6">
        {/* Current Scheme Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <IndianRupee className="size-5" />
              GST Scheme
            </CardTitle>
            <CardDescription>
              Your current GST registration type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-700">
                Current Scheme:
              </span>
              <StatusBadge
                status={currentScheme === 'composite' ? 'green' : 'blue'}
                label={currentScheme === 'composite' ? 'Composite' : 'Regular'}
              />
            </div>

            <p className="text-sm text-neutral-500">
              {currentScheme === 'composite'
                ? 'Under Composite scheme, you pay tax at a fixed rate and cannot charge GST on bills. Suitable for businesses with turnover below Rs 1.5 Cr.'
                : 'Under Regular scheme, you charge GST on all bills and can claim input tax credit. You must file monthly returns (GSTR-1, GSTR-3B).'}
            </p>

            <Separator />

            <Button
              variant="outline"
              onClick={() => setShowSchemeDialog(true)}
            >
              Switch to {targetScheme === 'composite' ? 'Composite' : 'Regular'} Scheme
            </Button>
          </CardContent>
        </Card>

        {/* GSTIN & State Code Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">GST Details</CardTitle>
            <CardDescription>
              Your GSTIN and state code for invoicing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSaveGstInfo} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  placeholder="e.g. 27AABCU9603R1ZM"
                  maxLength={15}
                  className="uppercase"
                  {...register('gstin')}
                />
                {errors.gstin && (
                  <p className="text-sm text-error-500" role="alert">
                    {errors.gstin.message}
                  </p>
                )}
                <p className="text-xs text-neutral-500">
                  15-character alphanumeric GST identification number
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="state-code">State Code</Label>
                <Input
                  id="state-code"
                  placeholder="e.g. 27"
                  maxLength={2}
                  {...register('stateCode')}
                />
                {errors.stateCode && (
                  <p className="text-sm text-error-500" role="alert">
                    {errors.stateCode.message}
                  </p>
                )}
                <p className="text-xs text-neutral-500">
                  2-digit state code (first 2 digits of your GSTIN)
                </p>
              </div>

              <Separator />

              <Button
                type="submit"
                disabled={!isDirty || updateGst.isPending}
                className="h-11 touch-target"
              >
                {updateGst.isPending ? 'Saving...' : 'Save GST Details'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Switch Scheme Confirmation Dialog */}
      <Dialog open={showSchemeDialog} onOpenChange={setShowSchemeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-warning-500" />
              Switch to {targetScheme === 'regular' ? 'Regular' : 'Composite'} GST
            </DialogTitle>
            <DialogDescription className="pt-2 text-left">
              {targetScheme === 'regular' ? (
                <>
                  <strong>Switching to Regular GST:</strong> You will need to
                  charge GST on all bills and file monthly returns (GSTR-1,
                  GSTR-3B). This action affects all future bills.
                </>
              ) : (
                <>
                  <strong>Switching to Composite:</strong> You cannot charge GST
                  or claim input tax credit. Suitable for turnover below Rs 1.5 Cr.
                  This action affects all future bills.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 desktop:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowSchemeDialog(false)}
              className="w-full desktop:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSwitchScheme}
              disabled={updateGst.isPending}
              className="w-full desktop:w-auto"
            >
              {updateGst.isPending
                ? 'Switching...'
                : `Switch to ${targetScheme === 'regular' ? 'Regular' : 'Composite'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
