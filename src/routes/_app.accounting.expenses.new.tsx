import { useEffect } from 'react'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { createExpense, updateExpense, getExpense, listExpenseCategories } from '@/api/expenses.api'
import { CurrencyInput } from '@/components/form/currency-input'
import { ImageUpload } from '@/components/form/image-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export const Route = createFileRoute('/_app/accounting/expenses/new')({
  component: ExpenseFormPage,
  validateSearch: (search: Record<string, unknown>) => ({
    edit: (search.edit as string) || undefined,
  }),
})

// ---------- Schema ----------

const expenseSchema = z.object({
  expenseDate: z.string().min(1, 'Date is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().optional(),
  isRecurring: z.boolean(),
  recurrenceInterval: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
  receiptImageUrl: z.string().optional(),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

// ---------- Page ----------

function ExpenseFormPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { edit: editId } = useSearch({ from: '/_app/accounting/expenses/new' })
  const isEdit = !!editId

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.expenses.categories(),
    queryFn: () => listExpenseCategories().then((res) => res.data),
  })

  // Fetch existing expense if editing
  const { data: existingExpense } = useQuery({
    queryKey: queryKeys.expenses.detail(editId ?? ''),
    queryFn: () => getExpense(editId!).then((res) => res.data),
    enabled: !!editId,
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expenseDate: new Date().toISOString().split('T')[0],
      category: '',
      amount: 0,
      description: '',
      isRecurring: false,
      recurrenceInterval: undefined,
      receiptImageUrl: '',
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (existingExpense) {
      reset({
        expenseDate: (existingExpense.expenseDate ?? '').split('T')[0],
        category: existingExpense.category,
        amount: Number(existingExpense.amount),
        description: existingExpense.description ?? '',
        isRecurring: existingExpense.isRecurring,
        recurrenceInterval: existingExpense.recurrenceInterval,
        receiptImageUrl: existingExpense.receiptImageUrl ?? '',
      })
    }
  }, [existingExpense, reset])

  // Create / Update mutation
  const mutation = useMutation({
    mutationFn: (data: ExpenseFormValues) => {
      if (isEdit && editId) {
        return updateExpense(editId, {
          expenseDate: data.expenseDate,
          category: data.category,
          amount: data.amount,
          description: data.description || undefined,
          isRecurring: data.isRecurring,
          recurrenceInterval: data.isRecurring ? data.recurrenceInterval : undefined,
          receiptImageUrl: data.receiptImageUrl || undefined,
        })
      }
      return createExpense({
        expenseDate: data.expenseDate,
        category: data.category,
        amount: data.amount,
        description: data.description || undefined,
        isRecurring: data.isRecurring,
        recurrenceInterval: data.isRecurring ? data.recurrenceInterval : undefined,
        receiptImageUrl: data.receiptImageUrl || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all() })
      toast.success(isEdit ? 'Expense updated.' : 'Expense created.')
      navigate({ to: '/accounting/expenses' })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to save expense.')
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Expense' : 'Add Expense'}</h1>
        <p className="text-sm text-muted-foreground">
          {isEdit ? 'Update expense details.' : 'Record a new business expense.'}
        </p>
      </div>

      <form className="max-w-lg space-y-6" onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        {/* Date */}
        <div className="space-y-1.5">
          <Label htmlFor="expenseDate">Date *</Label>
          <Input
            id="expenseDate"
            type="date"
            {...register('expenseDate')}
            aria-invalid={!!errors.expenseDate}
          />
          {errors.expenseDate && (
            <p className="text-xs text-destructive">{errors.expenseDate.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label>Category *</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={(val) => field.onChange(val ?? '')}>
                <SelectTrigger aria-invalid={!!errors.category}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <Label>Amount *</Label>
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <CurrencyInput value={field.value} onChange={field.onChange} placeholder="0" />
            )}
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Optional details about this expense..."
            {...register('description')}
          />
        </div>

        {/* Recurring Toggle */}
        <div className="flex items-center gap-3">
          <Controller
            control={control}
            name="isRecurring"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} id="recurring" />
            )}
          />
          <Label htmlFor="recurring">Recurring expense</Label>
        </div>

        {/* Receipt Upload */}
        <div className="space-y-1.5">
          <Label>Receipt Image</Label>
          <Controller
            control={control}
            name="receiptImageUrl"
            render={({ field }) => (
              <ImageUpload
                value={field.value ? [field.value] : []}
                onChange={(keys) => field.onChange(keys[0] ?? '')}
                purpose="expenses"
                maxFiles={1}
              />
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {isEdit ? 'Update Expense' : 'Save Expense'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate({ to: '/accounting/expenses' })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
