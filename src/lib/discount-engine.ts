import { roundTo2, roundToRupee } from './currency';

/**
 * 3-tier discount engine (mirrors backend logic).
 *
 * Per BRD FR-5.5.2:
 *   Tier 1: Product-level discount % per line item (reduces line price before subtotal)
 *   Tier 2: Bill-level discount % on subtotal (e.g., 15%)
 *   Tier 3: Bargain adjustment — additional flat amount off, OR a final price override
 *
 * Discount cap: effective total discount (all 3 tiers combined) measured against
 * MRP subtotal. If > configured cap (default 30%), requires owner approval.
 */

export interface DiscountLineItem {
  /** MRP per unit */
  mrp: number;
  /** Quantity */
  quantity: number;
  /** Product-level discount % (0–100) */
  productDiscountPct: number;
}

export interface DiscountInput {
  items: DiscountLineItem[];
  /** Bill-level discount % (0–100), e.g., 15 */
  billDiscountPct: number;
  /** Bargain adjustment: flat amount off (positive number), applied after bill discount */
  bargainAdjustment?: number;
  /** OR: final price override (customer says "I'll pay ₹X"). Mutually exclusive with bargainAdjustment. */
  finalPriceOverride?: number;
}

export interface DiscountResult {
  /** Sum of all item MRP × qty, before any discount */
  mrpSubtotal: number;
  /** Total of product-level discounts across all items */
  productDiscountTotal: number;
  /** Subtotal after product-level discounts */
  subtotalAfterProductDiscount: number;
  /** Bill-level discount amount */
  billDiscountAmount: number;
  /** Total after bill-level discount */
  totalAfterBillDiscount: number;
  /** Bargain adjustment amount (flat off or implied from finalPriceOverride) */
  bargainAdjustment: number;
  /** Net payable before rounding */
  netPayableExact: number;
  /** Net payable after rounding to nearest Rupee */
  netPayable: number;
  /** Round-off amount */
  roundOff: number;
  /** Effective total discount as % of MRP subtotal */
  effectiveDiscountPct: number;
  /** Per-item breakdown with proportionally allocated discounts */
  lineItems: DiscountLineItemResult[];
}

export interface DiscountLineItemResult {
  /** MRP × quantity */
  lineTotal: number;
  /** Product discount amount for this line */
  productDiscount: number;
  /** Price after product discount */
  priceAfterProductDiscount: number;
  /** This line's share of bill discount (proportional) */
  billDiscountShare: number;
  /** This line's share of bargain adjustment (proportional) */
  bargainShare: number;
  /** Final price for this line */
  finalPrice: number;
}

export function calculateDiscount(input: DiscountInput): DiscountResult {
  const { items, billDiscountPct, bargainAdjustment = 0, finalPriceOverride } = input;

  // Tier 1: Product-level discounts
  const lineResults: DiscountLineItemResult[] = items.map((item) => {
    const lineTotal = roundTo2(item.mrp * item.quantity);
    const productDiscount = roundTo2(lineTotal * (item.productDiscountPct / 100));
    const priceAfterProductDiscount = roundTo2(lineTotal - productDiscount);
    return {
      lineTotal,
      productDiscount,
      priceAfterProductDiscount,
      billDiscountShare: 0,
      bargainShare: 0,
      finalPrice: priceAfterProductDiscount,
    };
  });

  const mrpSubtotal = roundTo2(lineResults.reduce((sum, l) => sum + l.lineTotal, 0));
  const productDiscountTotal = roundTo2(lineResults.reduce((sum, l) => sum + l.productDiscount, 0));
  const subtotalAfterProductDiscount = roundTo2(mrpSubtotal - productDiscountTotal);

  // Tier 2: Bill-level discount
  const billDiscountAmount = roundTo2(subtotalAfterProductDiscount * (billDiscountPct / 100));
  const totalAfterBillDiscount = roundTo2(subtotalAfterProductDiscount - billDiscountAmount);

  // Tier 3: Bargain adjustment
  let effectiveBargain = 0;
  if (finalPriceOverride != null && finalPriceOverride >= 0) {
    effectiveBargain = roundTo2(totalAfterBillDiscount - finalPriceOverride);
    if (effectiveBargain < 0) effectiveBargain = 0; // Can't bargain UP
  } else {
    effectiveBargain = Math.max(0, bargainAdjustment);
  }

  const netPayableExact = roundTo2(totalAfterBillDiscount - effectiveBargain);
  const netPayable = roundToRupee(Math.max(0, netPayableExact));
  const roundOff = roundTo2(netPayable - netPayableExact);

  // Effective discount %
  const effectiveDiscountPct = mrpSubtotal > 0
    ? roundTo2(((mrpSubtotal - netPayableExact) / mrpSubtotal) * 100)
    : 0;

  // Proportional allocation of bill discount + bargain to line items
  if (subtotalAfterProductDiscount > 0) {
    for (const line of lineResults) {
      const proportion = line.priceAfterProductDiscount / subtotalAfterProductDiscount;
      line.billDiscountShare = roundTo2(billDiscountAmount * proportion);
      line.bargainShare = roundTo2(effectiveBargain * proportion);
      line.finalPrice = roundTo2(
        line.priceAfterProductDiscount - line.billDiscountShare - line.bargainShare
      );
    }
  }

  return {
    mrpSubtotal,
    productDiscountTotal,
    subtotalAfterProductDiscount,
    billDiscountAmount,
    totalAfterBillDiscount,
    bargainAdjustment: effectiveBargain,
    netPayableExact,
    netPayable,
    roundOff,
    effectiveDiscountPct,
    lineItems: lineResults,
  };
}

/** Check if the effective discount exceeds the configured cap. */
export function isDiscountOverCap(effectiveDiscountPct: number, cap: number = 30): boolean {
  return effectiveDiscountPct > cap;
}

/** Get the discount indicator color based on effective %. */
export function getDiscountColor(effectiveDiscountPct: number): 'green' | 'amber' | 'red' {
  if (effectiveDiscountPct < 20) return 'green';
  if (effectiveDiscountPct < 30) return 'amber';
  return 'red';
}
