import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Save, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TopBar } from '@/components/layout/top-bar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getSettings, updateSettings } from '@/api/settings.api'
import { getLabelTemplates } from '@/api/labels.api'
import { queryKeys } from '@/api/query-keys'

export const Route = createFileRoute('/_app/settings/templates')({
  component: TemplateSettingsPage,
})

const templateSchema = z.object({
  receipt_header_text: z.string().max(500, 'Header text too long'),
  receipt_footer_text: z.string().max(500, 'Footer text too long'),
  label_template_id: z.string().min(1, 'Please select a label template'),
})

type TemplateFormValues = z.infer<typeof templateSchema>

function TemplateSettingsPage() {
  const queryClient = useQueryClient()

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: queryKeys.settings(),
    queryFn: async () => {
      const res = await getSettings()
      return res.data
    },
  })

  const { data: labelTemplates, isLoading: templatesLoading } = useQuery({
    queryKey: queryKeys.labels.templates(),
    queryFn: async () => {
      const res = await getLabelTemplates()
      return res.data
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    values: settings
      ? {
          receipt_header_text: settings.receipt_header_text,
          receipt_footer_text: settings.receipt_footer_text,
          label_template_id: settings.label_template_id,
        }
      : undefined,
  })

  const headerText = watch('receipt_header_text') ?? ''
  const footerText = watch('receipt_footer_text') ?? ''
  const selectedTemplate = watch('label_template_id')

  const mutation = useMutation({
    mutationFn: (data: TemplateFormValues) => updateSettings(data),
    onSuccess: () => {
      toast.success('Template settings saved')
      queryClient.invalidateQueries({ queryKey: queryKeys.settings() })
      reset(undefined, { keepValues: true })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings')
    },
  })

  function onSubmit(data: TemplateFormValues) {
    mutation.mutate(data)
  }

  const isLoading = settingsLoading || templatesLoading

  if (isLoading) {
    return (
      <>
        <TopBar title="Templates" showBack />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar title="Templates" showBack />
      <div className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
          {/* Receipt Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Receipt Templates</CardTitle>
              <CardDescription>
                Customize the header and footer text that appears on printed receipts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Editor side */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="receipt_header_text">Receipt Header Text</Label>
                    <Textarea
                      id="receipt_header_text"
                      rows={4}
                      placeholder="e.g., Store Name&#10;Address Line 1&#10;Phone: 9876543210"
                      {...register('receipt_header_text')}
                      aria-invalid={!!errors.receipt_header_text}
                    />
                    {errors.receipt_header_text && (
                      <p className="text-xs text-destructive">
                        {errors.receipt_header_text.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receipt_footer_text">Receipt Footer Text</Label>
                    <Textarea
                      id="receipt_footer_text"
                      rows={3}
                      placeholder="e.g., Thank you for shopping with us!&#10;Exchange within 15 days with bill."
                      {...register('receipt_footer_text')}
                      aria-invalid={!!errors.receipt_footer_text}
                    />
                    {errors.receipt_footer_text && (
                      <p className="text-xs text-destructive">
                        {errors.receipt_footer_text.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Preview side */}
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <Card className="bg-white text-black">
                    <CardContent className="p-4 space-y-3 text-center font-mono text-xs">
                      {/* Header */}
                      <div className="whitespace-pre-wrap border-b border-dashed border-gray-300 pb-2">
                        {headerText || (
                          <span className="text-gray-400 italic">Header text...</span>
                        )}
                      </div>

                      {/* Mock receipt body */}
                      <div className="space-y-1 text-left border-b border-dashed border-gray-300 pb-2">
                        <div className="flex justify-between">
                          <span>Bill #: INV-001</span>
                          <span>01/01/2026</span>
                        </div>
                        <div className="border-t border-gray-200 mt-1 pt-1">
                          <div className="flex justify-between">
                            <span>T-Shirt (M)</span>
                            <span>x2</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span className="pl-2">@ 499.00</span>
                            <span>998.00</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Jeans (32)</span>
                            <span>x1</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span className="pl-2">@ 1,299.00</span>
                            <span>1,299.00</span>
                          </div>
                        </div>
                        <div className="border-t border-gray-200 mt-1 pt-1 flex justify-between font-semibold">
                          <span>Total</span>
                          <span>2,297.00</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="whitespace-pre-wrap pt-1">
                        {footerText || (
                          <span className="text-gray-400 italic">Footer text...</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Label Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Label Templates</CardTitle>
              <CardDescription>
                Choose the template for printing product barcode labels.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {labelTemplates && labelTemplates.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {labelTemplates.map((template) => {
                    const isSelected = selectedTemplate === template.id
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() =>
                          setValue('label_template_id', template.id, {
                            shouldDirty: true,
                          })
                        }
                        className={cn(
                          'relative flex flex-col items-start gap-1.5 rounded-lg border-2 p-4 text-left transition-colors',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40 hover:bg-muted/30'
                        )}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="size-3" />
                          </span>
                        )}
                        <span className="font-medium text-sm">{template.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {template.description}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No label templates available.
                </p>
              )}
              {errors.label_template_id && (
                <p className="text-xs text-destructive mt-2">
                  {errors.label_template_id.message}
                </p>
              )}
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
