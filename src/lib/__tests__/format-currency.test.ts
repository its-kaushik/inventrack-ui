import { describe, it, expect } from 'vitest'
import { formatIndianCurrency, formatCompact } from '../format-currency'

describe('formatIndianCurrency', () => {
  it('formats zero', () => {
    expect(formatIndianCurrency(0)).toBe('₹0.00')
  })

  it('formats hundreds', () => {
    expect(formatIndianCurrency(350)).toBe('₹350.00')
  })

  it('formats thousands with Indian grouping', () => {
    const result = formatIndianCurrency(12345)
    expect(result).toContain('12,345')
  })

  it('formats lakhs', () => {
    const result = formatIndianCurrency(1234567)
    expect(result).toContain('12,34,567')
  })

  it('formats negative values', () => {
    const result = formatIndianCurrency(-500)
    expect(result).toContain('500')
  })

  it('includes decimal places', () => {
    expect(formatIndianCurrency(99.5)).toContain('99.50')
  })
})

describe('formatCompact', () => {
  it('returns full format for small values', () => {
    expect(formatCompact(500)).toContain('500')
  })

  it('returns full Indian currency format for thousands (below 1L threshold)', () => {
    // formatCompact only compacts at >= 1 lakh; 5000 falls through to formatIndianCurrency
    expect(formatCompact(5000)).toContain('5,000')
  })

  it('formats lakhs as L', () => {
    expect(formatCompact(250000)).toBe('₹2.5L')
  })

  it('formats crores as Cr', () => {
    expect(formatCompact(15000000)).toBe('₹1.5Cr')
  })
})
