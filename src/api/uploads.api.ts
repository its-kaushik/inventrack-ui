import { apiPost } from '@/api/client'

export function getPresignedUrl(
  fileName: string,
  contentType: string,
  purpose: string,
) {
  return apiPost<{ url: string; key: string }>('/uploads/presign', {
    fileName,
    contentType,
    purpose,
  })
}
