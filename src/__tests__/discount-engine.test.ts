import { describe, it, expect } from 'vitest';
import {
  calculateDiscount,
  isDiscountOverCap,
  getDiscountColor,
  type DiscountInput,
} from '@/lib/discount-engine';

describe('calculateDiscount', () => {
  it('basic: no discounts at all', () => {
    const result = calculateDiscount({
      items: [{ mrp: 800, quantity: 1, productDiscountPct: 0 }],
      billDiscountPct: 0,
    });
    expect(result.mrpSubtotal).toBe(800);
    expect(result.netPayable).toBe(800);
    expect(result.effectiveDiscountPct).toBe(0);
  });

  it('product-level discount only', () => {
    const result = calculateDiscount({
      items: [{ mrp: 1000, quantity: 1, productDiscountPct: 10 }],
      billDiscountPct: 0,
    });
    expect(result.productDiscountTotal).toBe(100);
    expect(result.netPayable).toBe(900);
    expect(result.effectiveDiscountPct).toBe(10);
  });

  it('bill-level discount only (the common 15% case)', () => {
    const result = calculateDiscount({
      items: [
        { mrp: 800, quantity: 1, productDiscountPct: 0 },
        { mrp: 600, quantity: 1, productDiscountPct: 0 },
        { mrp: 500, quantity: 1, productDiscountPct: 0 },
      ],
      billDiscountPct: 15,
    });
    expect(result.mrpSubtotal).toBe(1900);
    expect(result.billDiscountAmount).toBe(285);
    expect(result.netPayable).toBe(1615);
  });

  it('3-tier: product + bill + bargain (BRD example)', () => {
    const result = calculateDiscount({
      items: [
        { mrp: 800, quantity: 1, productDiscountPct: 0 },
        { mrp: 600, quantity: 1, productDiscountPct: 0 },
        { mrp: 500, quantity: 1, productDiscountPct: 0 },
      ],
      billDiscountPct: 15,
      bargainAdjustment: 115,
    });
    expect(result.mrpSubtotal).toBe(1900);
    expect(result.billDiscountAmount).toBe(285);
    expect(result.bargainAdjustment).toBe(115);
    expect(result.netPayable).toBe(1500);
    // Effective: (1900 - 1500) / 1900 ≈ 21.05%
    expect(result.effectiveDiscountPct).toBeCloseTo(21.05, 1);
  });

  it('finalPriceOverride: customer says "I\'ll pay ₹1500"', () => {
    const result = calculateDiscount({
      items: [
        { mrp: 800, quantity: 1, productDiscountPct: 0 },
        { mrp: 600, quantity: 1, productDiscountPct: 0 },
        { mrp: 500, quantity: 1, productDiscountPct: 0 },
      ],
      billDiscountPct: 15,
      finalPriceOverride: 1500,
    });
    expect(result.netPayable).toBe(1500);
    expect(result.bargainAdjustment).toBe(115);
  });

  it('multiple quantities', () => {
    const result = calculateDiscount({
      items: [{ mrp: 400, quantity: 3, productDiscountPct: 0 }],
      billDiscountPct: 10,
    });
    expect(result.mrpSubtotal).toBe(1200);
    expect(result.billDiscountAmount).toBe(120);
    expect(result.netPayable).toBe(1080);
  });

  it('product discount + bill discount combined', () => {
    const result = calculateDiscount({
      items: [{ mrp: 1000, quantity: 1, productDiscountPct: 10 }],
      billDiscountPct: 15,
    });
    // After product discount: 900
    // Bill discount: 15% of 900 = 135
    // Net: 765
    expect(result.subtotalAfterProductDiscount).toBe(900);
    expect(result.billDiscountAmount).toBe(135);
    expect(result.netPayable).toBe(765);
    // Effective: (1000 - 765) / 1000 = 23.5%
    expect(result.effectiveDiscountPct).toBe(23.5);
  });

  it('proportional allocation to line items', () => {
    const result = calculateDiscount({
      items: [
        { mrp: 600, quantity: 1, productDiscountPct: 0 },
        { mrp: 400, quantity: 1, productDiscountPct: 0 },
      ],
      billDiscountPct: 10,
    });
    // Total: 1000, bill discount: 100
    // Line 1 share: 600/1000 * 100 = 60
    // Line 2 share: 400/1000 * 100 = 40
    expect(result.lineItems[0].billDiscountShare).toBe(60);
    expect(result.lineItems[1].billDiscountShare).toBe(40);
    expect(result.lineItems[0].finalPrice).toBe(540);
    expect(result.lineItems[1].finalPrice).toBe(360);
  });

  it('rounding: net payable rounds to nearest rupee', () => {
    const result = calculateDiscount({
      items: [{ mrp: 999, quantity: 1, productDiscountPct: 0 }],
      billDiscountPct: 15,
    });
    // 999 * 0.15 = 149.85, net = 849.15, rounded = 849
    expect(result.netPayableExact).toBeCloseTo(849.15, 2);
    expect(result.netPayable).toBe(849);
    expect(result.roundOff).toBeCloseTo(-0.15, 2);
  });

  it('finalPriceOverride cannot exceed totalAfterBillDiscount (no bargain UP)', () => {
    const result = calculateDiscount({
      items: [{ mrp: 1000, quantity: 1, productDiscountPct: 0 }],
      billDiscountPct: 10,
      finalPriceOverride: 2000, // more than subtotal
    });
    // bargainAdjustment should be 0 (can't bargain up)
    expect(result.bargainAdjustment).toBe(0);
    expect(result.netPayable).toBe(900);
  });

  it('empty cart', () => {
    const result = calculateDiscount({
      items: [],
      billDiscountPct: 15,
    });
    expect(result.mrpSubtotal).toBe(0);
    expect(result.netPayable).toBe(0);
    expect(result.effectiveDiscountPct).toBe(0);
  });

  it('negative bargainAdjustment treated as 0', () => {
    const result = calculateDiscount({
      items: [{ mrp: 1000, quantity: 1, productDiscountPct: 0 }],
      billDiscountPct: 0,
      bargainAdjustment: -100,
    });
    expect(result.bargainAdjustment).toBe(0);
    expect(result.netPayable).toBe(1000);
  });
});

describe('isDiscountOverCap', () => {
  it('under cap', () => {
    expect(isDiscountOverCap(25, 30)).toBe(false);
    expect(isDiscountOverCap(30, 30)).toBe(false);
  });

  it('over cap', () => {
    expect(isDiscountOverCap(30.01, 30)).toBe(true);
    expect(isDiscountOverCap(50, 30)).toBe(true);
  });

  it('uses default cap of 30', () => {
    expect(isDiscountOverCap(31)).toBe(true);
    expect(isDiscountOverCap(29)).toBe(false);
  });
});

describe('getDiscountColor', () => {
  it('green for < 20%', () => {
    expect(getDiscountColor(0)).toBe('green');
    expect(getDiscountColor(15)).toBe('green');
    expect(getDiscountColor(19.99)).toBe('green');
  });

  it('amber for 20–29%', () => {
    expect(getDiscountColor(20)).toBe('amber');
    expect(getDiscountColor(25)).toBe('amber');
    expect(getDiscountColor(29.99)).toBe('amber');
  });

  it('red for >= 30%', () => {
    expect(getDiscountColor(30)).toBe('red');
    expect(getDiscountColor(50)).toBe('red');
  });
});
