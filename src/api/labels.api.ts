import type { LabelItem } from '@/types/models'
import { apiGet, apiPost, apiPut } from '@/api/client'

export interface LabelTemplate {
  id: string
  name: string
  description: string
  fields: string[]
  layout?: { columns: number; labelWidth: string; labelHeight: string }
  createdAt?: string
}

export function generateLabels(data: {
  items: Array<{
    productId: string
    quantity: number
  }>
  templateId?: string
  format?: 'html' | 'json'
}) {
  return apiPost<LabelItem[]>('/labels/generate', { format: 'json', ...data })
}

export function getLabelTemplates() {
  return apiGet<LabelTemplate[]>('/labels/templates')
}

export function createLabelTemplate(data: {
  name: string
  description?: string
  fields: string[]
  layout?: { columns: number; labelWidth: string; labelHeight: string }
}) {
  return apiPost<LabelTemplate>('/labels/templates', data)
}

export function updateLabelTemplate(
  id: string,
  data: Partial<{
    name: string
    description: string
    fields: string[]
    layout: { columns: number; labelWidth: string; labelHeight: string }
  }>,
) {
  return apiPut<LabelTemplate>(`/labels/templates/${id}`, data)
}
