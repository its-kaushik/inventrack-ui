import { describe, it, expect } from 'vitest';
import {
  formatINR,
  formatINRDecimal,
  roundToRupee,
  roundTo2,
  calculateRoundOff,
  parseAmount,
} from '@/lib/currency';

describe('formatINR', () => {
  it('formats whole numbers with Indian grouping', () => {
    expect(formatINR(1234)).toBe('₹1,234');
    expect(formatINR(100000)).toBe('₹1,00,000');
    expect(formatINR(0)).toBe('₹0');
  });

  it('rounds to whole rupees', () => {
    expect(formatINR(1234.56)).toBe('₹1,235');
    expect(formatINR(1234.49)).toBe('₹1,234');
  });

  it('handles string input', () => {
    expect(formatINR('800')).toBe('₹800');
    expect(formatINR('1234.5')).toBe('₹1,235');
  });

  it('handles NaN/invalid', () => {
    expect(formatINR('abc')).toBe('₹0');
    expect(formatINR(NaN)).toBe('₹0');
  });
});

describe('formatINRDecimal', () => {
  it('formats with 2 decimal places', () => {
    expect(formatINRDecimal(1234.5)).toBe('₹1,234.50');
    expect(formatINRDecimal(0)).toBe('₹0.00');
  });
});

describe('roundToRupee', () => {
  it('rounds to nearest whole rupee', () => {
    expect(roundToRupee(1615.5)).toBe(1616);
    expect(roundToRupee(1615.49)).toBe(1615);
    expect(roundToRupee(1615.0)).toBe(1615);
    expect(roundToRupee(0.5)).toBe(1);
    expect(roundToRupee(0.49)).toBe(0);
  });
});

describe('roundTo2', () => {
  it('rounds to 2 decimal places', () => {
    // Note: 1.005 * 100 = 100.4999... due to floating point, so rounds to 1.00
    expect(roundTo2(1.005)).toBeCloseTo(1.0, 2);
    expect(roundTo2(1.006)).toBeCloseTo(1.01, 2);
    expect(roundTo2(1.004)).toBeCloseTo(1.0, 2);
    expect(roundTo2(172.5)).toBe(172.5);
    expect(roundTo2(285.0)).toBe(285);
  });
});

describe('calculateRoundOff', () => {
  it('positive round-off (rounded up)', () => {
    expect(calculateRoundOff(1615.5)).toBeCloseTo(0.5, 2);
  });

  it('positive round-off (rounded up from .6)', () => {
    // round(1615.6) = 1616, so round-off = 1616 - 1615.6 = +0.4
    expect(calculateRoundOff(1615.6)).toBeCloseTo(0.4, 1);
  });

  it('negative round-off (rounded down from .4)', () => {
    // round(1615.4) = 1615, so round-off = 1615 - 1615.4 = -0.4
    expect(calculateRoundOff(1615.4)).toBeCloseTo(-0.4, 1);
  });

  it('zero round-off for whole number', () => {
    expect(calculateRoundOff(1500.0)).toBe(0);
  });
});

describe('parseAmount', () => {
  it('parses string amounts', () => {
    expect(parseAmount('400.50')).toBe(400.5);
    expect(parseAmount('0')).toBe(0);
  });

  it('passes through numbers', () => {
    expect(parseAmount(100)).toBe(100);
  });

  it('handles null/undefined', () => {
    expect(parseAmount(null)).toBe(0);
    expect(parseAmount(undefined)).toBe(0);
  });

  it('handles invalid strings', () => {
    expect(parseAmount('abc')).toBe(0);
  });
});
