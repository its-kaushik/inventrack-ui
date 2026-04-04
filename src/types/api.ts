export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: {
    cursor?: string
    has_more?: boolean
  }
  error: ApiErrorDetail | null
}

export interface ApiErrorDetail {
  code: string
  message: string
  details?: Array<{ path: string; message: string }>
}

export interface PaginatedResponse<T> {
  items: T[]
  hasMore: boolean
}

export class ApiError extends Error {
  code: string
  status: number
  details?: Array<{ path: string; message: string }>

  constructor(
    code: string,
    message: string,
    details?: Array<{ path: string; message: string }>,
    status?: number,
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status ?? 500
    this.details = details
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}
