import type { LabelItem } from '@/types/models'
import { apiGet, apiPost } from '@/api/client'

export function generateLabels(data: {
  items: Array<{
    productId: string
    quantity: number
  }>
  templateId?: string
}) {
  return apiPost<LabelItem[]>('/labels/generate', { ...data, format: 'json' })
}

export function getLabelTemplates() {
  return apiGet<Array<{ id: string; name: string; description: string }>>('/labels/templates')
}
