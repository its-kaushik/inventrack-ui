/**
 * Currency formatting and rounding utilities for INR.
 *
 * Rules (per BRD FR-5.5.2):
 * - Internal calculations: 2 decimal places
 * - Net payable (final bill total): round to nearest whole Rupee
 * - Receipt display: whole Rupees (no paise)
 * - Round-off line shown on receipt for transparency
 */

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const INR_FORMATTER_DECIMAL = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format as whole Rupees: ₹1,234 */
export function formatINR(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';
  return INR_FORMATTER.format(num);
}

/** Format with 2 decimal places: ₹1,234.56 */
export function formatINRDecimal(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0.00';
  return INR_FORMATTER_DECIMAL.format(num);
}

/** Round to nearest whole Rupee (standard rounding). */
export function roundToRupee(amount: number): number {
  return Math.round(amount);
}

/** Round to 2 decimal places for internal calculations. */
export function roundTo2(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Calculate the round-off adjustment for a bill.
 * Returns the difference between rounded and unrounded totals.
 * Positive = rounded up, negative = rounded down.
 */
export function calculateRoundOff(exactTotal: number): number {
  return roundTo2(roundToRupee(exactTotal) - exactTotal);
}

/** Parse a string amount (from API) to number, defaulting to 0. */
export function parseAmount(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
}
