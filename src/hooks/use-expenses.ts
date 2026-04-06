import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  expensesApi,
  type ExpenseListParams,
  type CreateExpenseRequest,
} from '@/api/expenses.api';
import { toast } from 'sonner';

// ── Expenses ──

export function useExpenses(params?: ExpenseListParams) {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: () => expensesApi.list(params),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpenseRequest) => expensesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['cash-register'] });
      toast.success('Expense recorded');
    },
    onError: () => toast.error('Failed to record expense'),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['cash-register'] });
      toast.success('Expense deleted');
    },
    onError: () => toast.error('Failed to delete expense'),
  });
}

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => expensesApi.listCategories().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateExpenseCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) => expensesApi.createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expense-categories'] });
      toast.success('Category created');
    },
    onError: () => toast.error('Failed to create category'),
  });
}

// ── Cash Register ──

export function useCurrentRegister() {
  return useQuery({
    queryKey: ['cash-register', 'current'],
    queryFn: () => expensesApi.getCurrentRegister().then((r) => r.data),
  });
}

export function useOpenRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { openingBalance: number; notes?: string }) => expensesApi.openRegister(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-register'] });
      toast.success('Cash register opened');
    },
    onError: () => toast.error('Failed to open register'),
  });
}

export function useCloseRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { actualCash: number; notes?: string }) => expensesApi.closeRegister(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-register'] });
      toast.success('Cash register closed');
    },
    onError: () => toast.error('Failed to close register'),
  });
}
