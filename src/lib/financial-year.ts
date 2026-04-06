/**
 * Indian Financial Year utilities.
 * FY runs April 1 → March 31.
 * FY 2025-26 means April 2025 to March 2026.
 */

/** Get the FY start year for a given date. April onwards = same year, Jan–Mar = previous year. */
export function getFYStartYear(date: Date = new Date()): number {
  const month = date.getMonth(); // 0-indexed: 0=Jan, 3=Apr
  const year = date.getFullYear();
  return month >= 3 ? year : year - 1;
}

/** Get FY as "2025-26" format. */
export function getCurrentFY(date: Date = new Date()): string {
  const startYear = getFYStartYear(date);
  const endYear = startYear + 1;
  return `${startYear}-${String(endYear).slice(2)}`;
}

/** Get FY short code for bill numbers: "2526" for FY 2025-26. */
export function getFYShortCode(date: Date = new Date()): string {
  const startYear = getFYStartYear(date);
  const endYear = startYear + 1;
  return `${String(startYear).slice(2)}${String(endYear).slice(2)}`;
}

/** Get the start date of the current FY (April 1). */
export function getFYStartDate(date: Date = new Date()): Date {
  return new Date(getFYStartYear(date), 3, 1); // Month 3 = April
}

/** Get the end date of the current FY (March 31 of next year). */
export function getFYEndDate(date: Date = new Date()): Date {
  return new Date(getFYStartYear(date) + 1, 2, 31); // Month 2 = March
}

/** Check if two dates fall in the same FY. */
export function isSameFY(a: Date, b: Date): boolean {
  return getFYStartYear(a) === getFYStartYear(b);
}
