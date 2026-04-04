import { describe, it, expect } from 'vitest'
import { getCurrentFinancialYear, getQuarter } from '../financial-year'

describe('getCurrentFinancialYear', () => {
  it('returns a financial year object with start, end, label', () => {
    const fy = getCurrentFinancialYear()
    expect(fy).toHaveProperty('start')
    expect(fy).toHaveProperty('end')
    expect(fy).toHaveProperty('label')
    expect(fy.label).toMatch(/\d{4}-\d{2,4}/)
  })

  it('start is April 1', () => {
    const fy = getCurrentFinancialYear()
    expect(fy.start.getMonth()).toBe(3) // April = 3 (0-indexed)
    expect(fy.start.getDate()).toBe(1)
  })
})

describe('getQuarter', () => {
  it('returns 1 for April-June', () => {
    expect(getQuarter(new Date(2026, 3, 15))).toBe(1) // April
    expect(getQuarter(new Date(2026, 5, 30))).toBe(1) // June
  })

  it('returns 2 for July-September', () => {
    expect(getQuarter(new Date(2026, 6, 1))).toBe(2) // July
  })

  it('returns 3 for October-December', () => {
    expect(getQuarter(new Date(2026, 9, 1))).toBe(3) // October
  })

  it('returns 4 for January-March', () => {
    expect(getQuarter(new Date(2027, 0, 15))).toBe(4) // January
    expect(getQuarter(new Date(2027, 2, 31))).toBe(4) // March
  })
})
