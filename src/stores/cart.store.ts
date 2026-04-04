import { create } from 'zustand'
import type { Product, ProductSnapshot } from '@/types/models'

export interface CartItem {
  productId: string
  product: ProductSnapshot
  quantity: number
  lineTotal: number
}

export interface HeldBill {
  id: string
  items: CartItem[]
  customerId: string | null
  additionalDiscountAmount: number
  additionalDiscountPct: number
  note: string
  heldAt: string
}

interface CartState {
  items: CartItem[]
  customerId: string | null
  additionalDiscountAmount: number
  additionalDiscountPct: number
  heldBills: HeldBill[]

  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, qty: number) => void
  setCustomer: (id: string | null) => void
  setAdditionalDiscount: (amount: number, pct: number) => void
  clear: () => void
  holdCurrentCart: (note?: string) => void
  resumeHeldBill: (id: string) => void
  discardHeldBill: (id: string) => void
}

function calcLineTotal(sellingPrice: number, catalogDiscountPct: number, quantity: number): number {
  return sellingPrice * (1 - catalogDiscountPct / 100) * quantity
}

function snapshotFromProduct(product: Product): ProductSnapshot {
  return {
    name: product.name,
    sku: product.sku,
    size: product.size,
    sellingPrice: product.sellingPrice,
    catalogDiscountPct: product.catalogDiscountPct,
    gstRate: product.gstRate,
  }
}

const HELD_BILLS_KEY = 'inventrack-held-bills'

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerId: null,
  additionalDiscountAmount: 0,
  additionalDiscountPct: 0,
  heldBills: JSON.parse(localStorage.getItem(HELD_BILLS_KEY) ?? '[]') as HeldBill[],

  addItem: (product) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === product.id)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === product.id
              ? {
                  ...i,
                  quantity: i.quantity + 1,
                  lineTotal: calcLineTotal(
                    i.product.sellingPrice,
                    i.product.catalogDiscountPct,
                    i.quantity + 1,
                  ),
                }
              : i,
          ),
        }
      }
      const snapshot = snapshotFromProduct(product)
      return {
        items: [
          ...state.items,
          {
            productId: product.id,
            product: snapshot,
            quantity: 1,
            lineTotal: calcLineTotal(snapshot.sellingPrice, snapshot.catalogDiscountPct, 1),
          },
        ],
      }
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),

  updateQuantity: (productId, qty) =>
    set((state) => {
      if (qty <= 0) {
        return { items: state.items.filter((i) => i.productId !== productId) }
      }
      return {
        items: state.items.map((i) =>
          i.productId === productId
            ? {
                ...i,
                quantity: qty,
                lineTotal: calcLineTotal(
                  i.product.sellingPrice,
                  i.product.catalogDiscountPct,
                  qty,
                ),
              }
            : i,
        ),
      }
    }),

  setCustomer: (id) =>
    set({ customerId: id }),

  setAdditionalDiscount: (amount, pct) =>
    set({ additionalDiscountAmount: amount, additionalDiscountPct: pct }),

  clear: () =>
    set({
      items: [],
      customerId: null,
      additionalDiscountAmount: 0,
      additionalDiscountPct: 0,
    }),

  holdCurrentCart: (note = '') => {
    const state = get()
    if (state.items.length === 0) return
    const held: HeldBill = {
      id: crypto.randomUUID(),
      items: state.items,
      customerId: state.customerId,
      additionalDiscountAmount: state.additionalDiscountAmount,
      additionalDiscountPct: state.additionalDiscountPct,
      note,
      heldAt: new Date().toISOString(),
    }
    const newHeldBills = [...state.heldBills, held]
    localStorage.setItem(HELD_BILLS_KEY, JSON.stringify(newHeldBills))
    set({
      heldBills: newHeldBills,
      items: [],
      customerId: null,
      additionalDiscountAmount: 0,
      additionalDiscountPct: 0,
    })
  },

  resumeHeldBill: (id) => {
    const state = get()
    const bill = state.heldBills.find((b) => b.id === id)
    if (!bill) return
    const newHeldBills = state.heldBills.filter((b) => b.id !== id)
    localStorage.setItem(HELD_BILLS_KEY, JSON.stringify(newHeldBills))
    set({
      heldBills: newHeldBills,
      items: bill.items,
      customerId: bill.customerId,
      additionalDiscountAmount: bill.additionalDiscountAmount,
      additionalDiscountPct: bill.additionalDiscountPct,
    })
  },

  discardHeldBill: (id) => {
    const state = get()
    const newHeldBills = state.heldBills.filter((b) => b.id !== id)
    localStorage.setItem(HELD_BILLS_KEY, JSON.stringify(newHeldBills))
    set({ heldBills: newHeldBills })
  },
}))

// --- Computed selectors ---

export function selectSubtotal(state: CartState): number {
  return state.items.reduce((sum, item) => sum + item.lineTotal, 0)
}

export function selectCatalogDiscountTotal(state: CartState): number {
  return state.items.reduce((sum, item) => {
    const fullPrice = item.product.sellingPrice * item.quantity
    return sum + (fullPrice - item.lineTotal)
  }, 0)
}

export function selectNetAmount(state: CartState): number {
  const subtotal = selectSubtotal(state)
  return subtotal - state.additionalDiscountAmount
}

export function selectItemCount(state: CartState): number {
  return state.items.reduce((sum, item) => sum + item.quantity, 0)
}
