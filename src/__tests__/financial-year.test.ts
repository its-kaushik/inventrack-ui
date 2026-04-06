import { describe, it, expect } from 'vitest';
import {
  getFYStartYear,
  getCurrentFY,
  getFYShortCode,
  getFYStartDate,
  getFYEndDate,
  isSameFY,
} from '@/lib/financial-year';

describe('getFYStartYear', () => {
  it('April onwards returns same year', () => {
    expect(getFYStartYear(new Date(2026, 3, 1))).toBe(2026);  // April 1
    expect(getFYStartYear(new Date(2026, 11, 31))).toBe(2026); // December 31
  });

  it('Jan–March returns previous year', () => {
    expect(getFYStartYear(new Date(2026, 0, 1))).toBe(2025);  // January 1
    expect(getFYStartYear(new Date(2026, 2, 31))).toBe(2025);  // March 31
  });

  it('boundary: March 31 → previous year', () => {
    expect(getFYStartYear(new Date(2026, 2, 31))).toBe(2025);
  });

  it('boundary: April 1 → same year', () => {
    expect(getFYStartYear(new Date(2026, 3, 1))).toBe(2026);
  });
});

describe('getCurrentFY', () => {
  it('returns FY label', () => {
    expect(getCurrentFY(new Date(2026, 5, 15))).toBe('2026-27'); // June 2026
    expect(getCurrentFY(new Date(2026, 1, 15))).toBe('2025-26'); // February 2026
  });

  it('boundary dates', () => {
    expect(getCurrentFY(new Date(2026, 2, 31))).toBe('2025-26'); // March 31
    expect(getCurrentFY(new Date(2026, 3, 1))).toBe('2026-27');  // April 1
  });
});

describe('getFYShortCode', () => {
  it('returns 4-digit short code for bill numbers', () => {
    expect(getFYShortCode(new Date(2026, 5, 15))).toBe('2627');
    expect(getFYShortCode(new Date(2025, 5, 15))).toBe('2526');
    expect(getFYShortCode(new Date(2026, 1, 15))).toBe('2526'); // Feb = still FY 2025-26
  });
});

describe('getFYStartDate', () => {
  it('returns April 1 of FY start year', () => {
    const d = getFYStartDate(new Date(2026, 5, 15));
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3); // April
    expect(d.getDate()).toBe(1);
  });

  it('for Jan-Mar, returns April 1 of previous year', () => {
    const d = getFYStartDate(new Date(2026, 1, 15)); // Feb 2026
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(3);
    expect(d.getDate()).toBe(1);
  });
});

describe('getFYEndDate', () => {
  it('returns March 31 of next year', () => {
    const d = getFYEndDate(new Date(2026, 5, 15));
    expect(d.getFullYear()).toBe(2027);
    expect(d.getMonth()).toBe(2); // March
    expect(d.getDate()).toBe(31);
  });
});

describe('isSameFY', () => {
  it('same FY returns true', () => {
    expect(isSameFY(new Date(2026, 5, 1), new Date(2027, 1, 1))).toBe(true); // June 2026 & Feb 2027
  });

  it('different FY returns false', () => {
    expect(isSameFY(new Date(2026, 2, 31), new Date(2026, 3, 1))).toBe(false); // March 31 vs April 1
  });
});
