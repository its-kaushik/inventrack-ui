const indianCurrencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
})

export function formatIndianCurrency(amount: number): string {
  return indianCurrencyFormatter.format(amount)
}

export function formatCompact(amount: number): string {
  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  if (absAmount >= 1_00_00_000) {
    const crores = absAmount / 1_00_00_000
    return `${sign}\u20B9${parseFloat(crores.toFixed(1))}Cr`
  }

  if (absAmount >= 1_00_000) {
    const lakhs = absAmount / 1_00_000
    return `${sign}\u20B9${parseFloat(lakhs.toFixed(1))}L`
  }

  return formatIndianCurrency(amount)
}
