import { describe, it, expect } from 'vitest'
import { formatDate, formatDateTime } from '../format-date'

describe('formatDate', () => {
  it('formats ISO date to DD-MM-YYYY', () => {
    const result = formatDate('2026-04-01')
    expect(result).toBe('01-04-2026')
  })

  it('formats Date object', () => {
    const result = formatDate(new Date(2026, 3, 15)) // April 15, 2026
    expect(result).toBe('15-04-2026')
  })
})

describe('formatDateTime', () => {
  it('includes time', () => {
    const result = formatDateTime('2026-04-01T10:30:00.000Z')
    expect(result).toMatch(/01-04-2026/)
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})
