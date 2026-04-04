export function formatTaxBreakup(
  taxAmount: number,
  scheme: 'regular' | 'composition',
): { cgst: number; sgst: number } | null {
  if (scheme === 'composition') return null

  const half = Math.round((taxAmount / 2) * 100) / 100
  return {
    cgst: half,
    sgst: Math.round((taxAmount - half) * 100) / 100,
  }
}

export function getInvoiceType(
  scheme: 'regular' | 'composition',
): string {
  return scheme === 'regular' ? 'Tax Invoice' : 'Bill of Supply'
}

export function getCompositionDeclaration(): string {
  return 'Composition taxable person, not eligible to collect tax on supplies'
}
