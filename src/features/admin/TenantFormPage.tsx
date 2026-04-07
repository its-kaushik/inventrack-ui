import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useCreateTenant } from '@/hooks/use-admin';
import { phoneSchema, requiredString } from '@/lib/validators';

const tenantSchema = z.object({
  name: requiredString,
  ownerName: requiredString,
  ownerEmail: z.string().email('Invalid email'),
  ownerPhone: phoneSchema,
  gstScheme: z.enum(['composite', 'regular'], { message: 'GST scheme is required' }),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  gstin: z.string().optional(),
});

type TenantFormData = z.infer<typeof tenantSchema>;

interface CreatedOwnerInfo {
  ownerName: string;
  ownerEmail: string;
  tempPassword: string;
}

export default function TenantFormPage() {
  const navigate = useNavigate();
  const createTenant = useCreateTenant();
  const [createdOwner, setCreatedOwner] = useState<CreatedOwnerInfo | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      gstScheme: 'composite',
    },
  });

  const gstScheme = watch('gstScheme');

  const onSubmit = handleSubmit((data) => {
    createTenant.mutate(
      {
        name: data.name,
        ownerName: data.ownerName,
        ownerEmail: data.ownerEmail,
        ownerPhone: data.ownerPhone,
        gstScheme: data.gstScheme,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email || null,
        gstin: data.gstin || null,
      },
      {
        onSuccess: (res) => {
          const { tempPassword } = res.data as { tempPassword?: string };
          if (tempPassword) {
            setCreatedOwner({
              ownerName: data.ownerName,
              ownerEmail: data.ownerEmail,
              tempPassword,
            });
          } else {
            navigate('/admin/tenants');
          }
        },
      },
    );
  });

  const handleCopy = async () => {
    if (!createdOwner) return;
    const text = `Email: ${createdOwner.ownerEmail}\nTemporary Password: ${createdOwner.tempPassword}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Success screen — show temp password ──
  if (createdOwner) {
    return (
      <div className="space-y-4 p-4 desktop:p-6">
        <PageHeader title="Tenant Created" />
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle className="text-base text-success-600">Owner Account Created</CardTitle>
            <p className="text-sm text-neutral-500">
              Share these credentials with <strong>{createdOwner.ownerName}</strong> so they can log in. The password cannot be retrieved later.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 rounded-lg bg-neutral-50 p-4 font-mono text-sm">
              <div>
                <span className="text-neutral-500">Email: </span>
                <span className="font-semibold text-neutral-800">{createdOwner.ownerEmail}</span>
              </div>
              <div>
                <span className="text-neutral-500">Password: </span>
                <span className="font-semibold text-neutral-800">{createdOwner.tempPassword}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCopy} className="gap-1.5">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'Copied' : 'Copy Credentials'}
              </Button>
              <Button onClick={() => navigate('/admin/tenants')}>
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 desktop:p-6">
      <PageHeader title="Create Tenant" showBack onBack={() => navigate('/admin/tenants')} />

      <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6">
        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Business Name <span className="text-error-500">*</span></Label>
              <Input id="name" {...register('name')} placeholder="e.g., Kaushik Vastra Bhandar" />
              {errors.name && <p className="text-sm text-error-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" {...register('address')} placeholder="Store address" rows={2} />
            </div>

            <div className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Store Phone</Label>
                <Input id="phone" {...register('phone')} placeholder="Store phone number" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Store Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="Store email" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="gstScheme">GST Scheme <span className="text-error-500">*</span></Label>
                <Select value={gstScheme} onValueChange={(val) => setValue('gstScheme', (val ?? 'composite') as 'composite' | 'regular')}>
                  <SelectTrigger id="gstScheme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="composite">Composite (1% flat on turnover)</SelectItem>
                    <SelectItem value="regular">Regular (charge GST + claim ITC)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gstScheme && <p className="text-sm text-error-500">{errors.gstScheme.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input id="gstin" {...register('gstin')} placeholder="15-character GSTIN" className="font-mono uppercase" maxLength={15} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Owner Account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Owner Account</CardTitle>
            <p className="text-sm text-neutral-500">An owner account will be created with a temporary password.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ownerName">Owner Name <span className="text-error-500">*</span></Label>
              <Input id="ownerName" {...register('ownerName')} placeholder="Full name" />
              {errors.ownerName && <p className="text-sm text-error-500">{errors.ownerName.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ownerEmail">Owner Email <span className="text-error-500">*</span></Label>
                <Input id="ownerEmail" type="email" {...register('ownerEmail')} placeholder="owner@example.com" />
                {errors.ownerEmail && <p className="text-sm text-error-500">{errors.ownerEmail.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ownerPhone">Owner Phone <span className="text-error-500">*</span></Label>
                <Input id="ownerPhone" inputMode="numeric" {...register('ownerPhone')} placeholder="10-digit phone" maxLength={10} />
                {errors.ownerPhone && <p className="text-sm text-error-500">{errors.ownerPhone.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/tenants')}>
            Cancel
          </Button>
          <Button type="submit" disabled={createTenant.isPending}>
            {createTenant.isPending ? 'Creating...' : 'Create Tenant'}
          </Button>
        </div>
      </form>
    </div>
  );
}
