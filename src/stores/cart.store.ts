import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { calculateDiscount, type DiscountResult, type DiscountLineItem } from '@/lib/discount-engine';
import type { PaymentMethod } from '@/types/enums';

// ── Types ──

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantDescription: string;
  sku: string;
  barcode: string;
  mrp: number;
  costPrice: number;
  quantity: number;
  productDiscountPct: number;
  gstRate: number;
  hsnCode: string | null;
  /** Optimistic locking — checked when submitting sale */
  version: number;
}

export interface CartPayment {
  method: PaymentMethod;
  amount: number;
}

export interface CartCustomer {
  id: string;
  name: string;
  phone: string;
  outstandingBalance: number;
}

interface CartState {
  // Customer
  customer: CartCustomer | null;
  newOfflineCustomer: { name: string; phone: string } | null;

  // Items
  items: CartItem[];

  // Discounts
  billDiscountPct: number;
  bargainAdjustment: number;
  finalPriceOverride: number | null;
  approvalToken: string | null;

  // Calculated (recomputed on every change)
  discountResult: DiscountResult | null;

  // Payments
  payments: CartPayment[];

  // Actions
  setCustomer: (customer: CartCustomer) => void;
  setNewOfflineCustomer: (data: { name: string; phone: string }) => void;
  clearCustomer: () => void;

  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;

  setBillDiscountPct: (pct: number) => void;
  setBargainAdjustment: (amount: number) => void;
  setFinalPriceOverride: (price: number | null) => void;
  setApprovalToken: (token: string | null) => void;

  setPayments: (payments: CartPayment[]) => void;

  recalculate: () => void;
  clearCart: () => void;
}

function buildDiscountInput(state: { items: CartItem[]; billDiscountPct: number; bargainAdjustment: number; finalPriceOverride: number | null }) {
  const discountItems: DiscountLineItem[] = state.items.map((item) => ({
    mrp: item.mrp,
    quantity: item.quantity,
    productDiscountPct: item.productDiscountPct,
  }));

  return {
    items: discountItems,
    billDiscountPct: state.billDiscountPct,
    bargainAdjustment: state.bargainAdjustment,
    finalPriceOverride: state.finalPriceOverride ?? undefined,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      customer: null,
      newOfflineCustomer: null,
      items: [],
      billDiscountPct: 0,
      bargainAdjustment: 0,
      finalPriceOverride: null,
      approvalToken: null,
      discountResult: null,
      payments: [],

      setCustomer: (customer) => set({ customer, newOfflineCustomer: null }),
      setNewOfflineCustomer: (data) => set({ newOfflineCustomer: data, customer: null }),
      clearCustomer: () => set({ customer: null, newOfflineCustomer: null }),

      addItem: (item) => {
        const { items } = get();
        const existing = items.find((i) => i.variantId === item.variantId);
        if (existing) {
          set({
            items: items.map((i) =>
              i.variantId === item.variantId ? { ...i, quantity: i.quantity + 1 } : i,
            ),
          });
        } else {
          set({ items: [...items, { ...item, quantity: 1 }] });
        }
        get().recalculate();
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i,
          ),
        });
        get().recalculate();
      },

      removeItem: (variantId) => {
        set({ items: get().items.filter((i) => i.variantId !== variantId) });
        get().recalculate();
      },

      setBillDiscountPct: (pct) => {
        set({ billDiscountPct: pct, finalPriceOverride: null, approvalToken: null });
        get().recalculate();
      },

      setBargainAdjustment: (amount) => {
        set({ bargainAdjustment: amount, finalPriceOverride: null, approvalToken: null });
        get().recalculate();
      },

      setFinalPriceOverride: (price) => {
        set({ finalPriceOverride: price, bargainAdjustment: 0, approvalToken: null });
        get().recalculate();
      },

      setApprovalToken: (token) => set({ approvalToken: token }),

      setPayments: (payments) => set({ payments }),

      recalculate: () => {
        const state = get();
        if (state.items.length === 0) {
          set({ discountResult: null });
          return;
        }
        const input = buildDiscountInput(state);
        const result = calculateDiscount(input);
        set({ discountResult: result });
      },

      clearCart: () =>
        set({
          customer: null,
          newOfflineCustomer: null,
          items: [],
          billDiscountPct: 0,
          bargainAdjustment: 0,
          finalPriceOverride: null,
          approvalToken: null,
          discountResult: null,
          payments: [],
        }),
    }),
    {
      name: 'inventrack-cart',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
