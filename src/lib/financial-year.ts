export function getCurrentFinancialYear(): {
  start: Date
  end: Date
  label: string
} {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() // 0-indexed

  // Indian FY starts April 1
  const startYear = month >= 3 ? year : year - 1
  const endYear = startYear + 1

  return {
    start: new Date(startYear, 3, 1), // April 1
    end: new Date(endYear, 2, 31), // March 31
    label: `FY ${startYear}-${String(endYear).slice(2)}`,
  }
}

export function getQuarter(date?: Date): number {
  const d = date ?? new Date()
  const month = d.getMonth() // 0-indexed

  // Indian FY quarters:
  // Q1: Apr-Jun (months 3-5)
  // Q2: Jul-Sep (months 6-8)
  // Q3: Oct-Dec (months 9-11)
  // Q4: Jan-Mar (months 0-2)
  if (month >= 3 && month <= 5) return 1
  if (month >= 6 && month <= 8) return 2
  if (month >= 9 && month <= 11) return 3
  return 4
}
