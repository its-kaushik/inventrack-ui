import type { Expense, ExpenseCategory } from '@/types/models'
import type { PaginatedResponse } from '@/types/api'
import { apiGet, apiPost, apiPut, apiDelete } from '@/api/client'

export interface ExpenseFilters {
  category?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

export function listExpenses(filters?: ExpenseFilters) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) params.set(key, String(value))
    })
  }
  const qs = params.toString()
  return apiGet<PaginatedResponse<Expense>>(`/expenses${qs ? `?${qs}` : ''}`)
}

export function getExpense(id: string) {
  return apiGet<Expense>(`/expenses/${id}`)
}

export function createExpense(data: {
  date: string
  category: string
  amount: number
  description?: string
  isRecurring?: boolean
  receiptImageUrl?: string
}) {
  return apiPost<Expense>('/expenses', data)
}

export function updateExpense(
  id: string,
  data: Partial<{
    date: string
    category: string
    amount: number
    description: string
    isRecurring: boolean
    receiptImageUrl: string
  }>,
) {
  return apiPut<Expense>(`/expenses/${id}`, data)
}

export function deleteExpense(id: string) {
  return apiDelete<void>(`/expenses/${id}`)
}

export function listExpenseCategories() {
  return apiGet<ExpenseCategory[]>('/expenses/categories')
}
