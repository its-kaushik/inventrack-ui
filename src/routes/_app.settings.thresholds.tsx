import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { TopBar } from '@/components/layout/top-bar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CurrencyInput } from '@/components/form/currency-input'
import { getSettings, updateSettings } from '@/api/settings.api'
import { queryKeys } from '@/api/query-keys'

export const Route = createFileRoute('/_app/settings/thresholds')({
  component: ThresholdSettingsPage,
})

const thresholdSchema = z.object({
  low_stock_default_threshold: z.number().min(1, 'Must be at least 1').max(10000),
  aging_threshold_days: z.number().min(1, 'Must be at least 1 day').max(365),
  return_window_days: z.number().min(1, 'Must be at least 1 day').max(90),
  max_salesperson_discount_amount: z.number().min(0, 'Cannot be negative'),
  max_salesperson_discount_percent: z
    .number()
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),
})

type ThresholdFormValues = z.infer<typeof thresholdSchema>

function ThresholdSettingsPage() {
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: queryKeys.settings(),
    queryFn: async () => {
      const res = await getSettings()
      return res.data
    },
  })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset,
  } = useForm<ThresholdFormValues>({
    resolver: zodResolver(thresholdSchema),
    values: settings
      ? {
          low_stock_default_threshold: settings.low_stock_default_threshold,
          aging_threshold_days: settings.aging_threshold_days,
          return_window_days: settings.return_window_days,
          max_salesperson_discount_amount: settings.max_salesperson_discount_amount,
          max_salesperson_discount_percent: settings.max_salesperson_discount_percent,
        }
      : undefined,
  })

  const mutation = useMutation({
    mutationFn: (data: ThresholdFormValues) => updateSettings(data),
    onSuccess: () => {
      toast.success('Threshold settings saved')
      queryClient.invalidateQueries({ queryKey: queryKeys.settings() })
      reset(undefined, { keepValues: true })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings')
    },
  })

  function onSubmit(data: ThresholdFormValues) {
    mutation.mutate(data)
  }

  if (isLoading) {
    return (
      <>
        <TopBar title="Thresholds" showBack />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar title="Thresholds" showBack />
      <div className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
          {/* Stock Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Thresholds</CardTitle>
              <CardDescription>
                Configure default low stock and aging inventory thresholds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="low_stock_default_threshold">
                  Low Stock Default Threshold
                </Label>
                <Input
                  id="low_stock_default_threshold"
                  type="number"
                  min={1}
                  max={10000}
                  {...register('low_stock_default_threshold', { valueAsNumber: true })}
                  aria-invalid={!!errors.low_stock_default_threshold}
                />
                {errors.low_stock_default_threshold && (
                  <p className="text-xs text-destructive">
                    {errors.low_stock_default_threshold.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Products below this quantity will be flagged as low stock.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aging_threshold_days">Aging Threshold (days)</Label>
                <Input
                  id="aging_threshold_days"
                  type="number"
                  min={1}
                  max={365}
                  {...register('aging_threshold_days', { valueAsNumber: true })}
                  aria-invalid={!!errors.aging_threshold_days}
                />
                {errors.aging_threshold_days && (
                  <p className="text-xs text-destructive">
                    {errors.aging_threshold_days.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Inventory older than this will be flagged as aging stock.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Return Window */}
          <Card>
            <CardHeader>
              <CardTitle>Return Policy</CardTitle>
              <CardDescription>Configure the return acceptance window.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="return_window_days">Return Window (days)</Label>
                <Input
                  id="return_window_days"
                  type="number"
                  min={1}
                  max={90}
                  {...register('return_window_days', { valueAsNumber: true })}
                  aria-invalid={!!errors.return_window_days}
                />
                {errors.return_window_days && (
                  <p className="text-xs text-destructive">
                    {errors.return_window_days.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Number of days after purchase within which returns are accepted.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Discount Limits */}
          <Card>
            <CardHeader>
              <CardTitle>Discount Limits</CardTitle>
              <CardDescription>
                Set the maximum discount a salesperson can offer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Max Salesperson Discount Amount</Label>
                <Controller
                  name="max_salesperson_discount_amount"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0"
                    />
                  )}
                />
                {errors.max_salesperson_discount_amount && (
                  <p className="text-xs text-destructive">
                    {errors.max_salesperson_discount_amount.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Maximum flat discount amount a salesperson can apply per bill.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_salesperson_discount_percent">
                  Max Salesperson Discount Percent (%)
                </Label>
                <Input
                  id="max_salesperson_discount_percent"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  {...register('max_salesperson_discount_percent', {
                    valueAsNumber: true,
                  })}
                  aria-invalid={!!errors.max_salesperson_discount_percent}
                />
                {errors.max_salesperson_discount_percent && (
                  <p className="text-xs text-destructive">
                    {errors.max_salesperson_discount_percent.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Maximum percentage discount a salesperson can apply per bill.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end">
            <Button type="submit" disabled={!isDirty || mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
