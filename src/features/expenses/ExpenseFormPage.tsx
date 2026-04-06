import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Plus, Check } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout';
import { CurrencyInput } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useCreateExpense,
} from '@/hooks/use-expenses';
import { toISODate } from '@/lib/format-date';

// ── Constants ──

const ADD_NEW_SENTINEL = '__add_new__';

// ── Zod Schema ──

const expenseSchema = z.object({
  expenseDate: z.string().min(1, 'Date is required'),
  amount: z.number({ message: 'Amount is required' }).positive('Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Category is required'),
  paymentMode: z.enum(['cash', 'upi', 'bank_transfer'], {
    message: 'Payment mode is required',
  }),
  description: z.string().min(1, 'Description is required'),
  notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

// ── Skeleton ──

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 py-4 desktop:px-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="mt-4 h-11 w-full" />
    </div>
  );
}

// ── Main Page ──

export default function ExpenseFormPage() {
  const navigate = useNavigate();

  // ── Data ──
  const { data: categories = [], isLoading: categoriesLoading } = useExpenseCategories();
  const createExpense = useCreateExpense();
  const createCategory = useCreateExpenseCategory();

  // ── Add-new-category inline state ──
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  // ── Form ──
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expenseDate: format(new Date(), 'yyyy-MM-dd'),
      amount: undefined,
      categoryId: '',
      paymentMode: undefined,
      description: '',
      notes: '',
    },
  });

  // ── Handlers ──

  const handleCategoryChange = (val: string | null) => {
    const value = val ?? '';
    if (value === ADD_NEW_SENTINEL) {
      setShowNewCategory(true);
      return;
    }
    setShowNewCategory(false);
    setValue('categoryId', value, { shouldValidate: true });
  };

  const handleSaveNewCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error('Category name cannot be empty');
      return;
    }

    setSavingCategory(true);
    try {
      const result = await createCategory.mutateAsync({ name: trimmed });
      const newCat = result.data;
      setValue('categoryId', newCat.id, { shouldValidate: true });
      setShowNewCategory(false);
      setNewCategoryName('');
    } catch {
      // Error toast is handled by the mutation hook
    } finally {
      setSavingCategory(false);
    }
  };

  const onSubmit = async (data: ExpenseFormValues) => {
    try {
      await createExpense.mutateAsync({
        categoryId: data.categoryId,
        amount: data.amount,
        description: data.description,
        expenseDate: data.expenseDate,
        paymentMode: data.paymentMode,
        notes: data.notes || null,
      });
      navigate('/expenses');
    } catch {
      // Error toast is handled by the mutation hook
    }
  };

  if (categoriesLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <PageHeader title="Add Expense" showBack />
        <FormSkeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader title="Add Expense" showBack />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-1 flex-col gap-5 px-4 pb-8 desktop:max-w-xl desktop:px-6"
      >
        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expense-date">Date</Label>
          <Input
            id="expense-date"
            type="date"
            {...register('expenseDate')}
          />
          {errors.expenseDate && (
            <p className="text-xs text-error-600">{errors.expenseDate.message}</p>
          )}
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <Label>Amount</Label>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                value={field.value ?? ''}
                onChange={(val) => field.onChange(val === '' ? undefined : val)}
              />
            )}
          />
          {errors.amount && (
            <p className="text-xs text-error-600">{errors.amount.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expense-category">Category</Label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <>
                <Select
                  value={showNewCategory ? ADD_NEW_SENTINEL : field.value}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger className="w-full" id="expense-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                    <SelectSeparator />
                    <SelectItem value={ADD_NEW_SENTINEL}>
                      <Plus className="size-3.5" />
                      Add New Category
                    </SelectItem>
                  </SelectContent>
                </Select>

                {showNewCategory && (
                  <Card className="mt-2 border-dashed">
                    <CardContent className="flex items-center gap-2 p-3">
                      <Input
                        placeholder="New category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveNewCategory();
                          }
                        }}
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveNewCategory}
                        disabled={savingCategory}
                      >
                        {savingCategory ? 'Saving...' : <Check className="size-4" />}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          />
          {errors.categoryId && (
            <p className="text-xs text-error-600">{errors.categoryId.message}</p>
          )}
        </div>

        {/* Payment Mode */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expense-payment">Payment Mode</Label>
          <Controller
            name="paymentMode"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? ''}
                onValueChange={(val) => field.onChange(val ?? '')}
              >
                <SelectTrigger className="w-full" id="expense-payment">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.paymentMode && (
            <p className="text-xs text-error-600">{errors.paymentMode.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expense-description">Description</Label>
          <Input
            id="expense-description"
            placeholder="e.g. Electricity bill, shop rent"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-xs text-error-600">{errors.description.message}</p>
          )}
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expense-notes">Notes (optional)</Label>
          <Textarea
            id="expense-notes"
            placeholder="Any additional details..."
            rows={3}
            {...register('notes')}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="mt-2 w-full"
          disabled={isSubmitting || createExpense.isPending}
        >
          {createExpense.isPending ? 'Saving...' : 'Save Expense'}
        </Button>
      </form>
    </div>
  );
}
