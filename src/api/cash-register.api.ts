import type { CashRegister } from '@/types/models'
import { apiGet, apiPost } from '@/api/client'

export function openRegister(openingBalance: number) {
  return apiPost<CashRegister>('/cash-register/open', { openingBalance })
}

export function getCurrentRegister() {
  return apiGet<CashRegister>('/cash-register/current')
}

export function getRegister(id: string) {
  return apiGet<CashRegister>(`/cash-register/${id}`)
}

export function closeRegister(id: string, actualClosing: number) {
  return apiPost<CashRegister>(`/cash-register/${id}/close`, { actualClosing })
}

export function getRegisterHistory() {
  return apiGet<CashRegister[]>('/cash-register/history')
}
