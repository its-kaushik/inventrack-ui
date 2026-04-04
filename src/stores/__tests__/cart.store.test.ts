import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore, selectSubtotal, selectItemCount } from '../cart.store'
import type { Product } from '@/types/models'

const mockProduct: Product = {
  id: 'prod-1',
  tenantId: 'tenant-1',
  name: 'Rupa RN Vest - L',
  sku: 'MVT-RPA-RN-L-001',
  barcode: 'MVT-RPA-RN-L-001',
  categoryId: 'cat-1',
  subTypeId: null,
  brandId: 'br-1',
  size: 'L',
  color: 'White',
  hsnCode: '61089200',
  gstRate: 5,
  sellingPrice: 350,
  costPrice: 200,
  mrp: 400,
  catalogDiscountPct: 10,
  minStockLevel: 10,
  reorderPoint: null,
  description: null,
  imageUrls: [],
  isActive: true,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

const mockProduct2: Product = {
  ...mockProduct,
  id: 'prod-2',
  name: 'Levis Slim Jeans - 32',
  sku: 'JNS-LVS-SLM-32-001',
  barcode: 'JNS-LVS-SLM-32-001',
  sellingPrice: 1500,
  catalogDiscountPct: 0,
}

describe('Cart Store', () => {
  beforeEach(() => {
    useCartStore.getState().clear()
  })

  it('starts empty', () => {
    const state = useCartStore.getState()
    expect(state.items).toHaveLength(0)
    expect(state.customerId).toBeNull()
  })

  it('adds item to cart', () => {
    useCartStore.getState().addItem(mockProduct)
    const state = useCartStore.getState()
    expect(state.items).toHaveLength(1)
    expect(state.items[0].productId).toBe('prod-1')
    expect(state.items[0].quantity).toBe(1)
  })

  it('increments qty when adding same product', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().addItem(mockProduct)
    const state = useCartStore.getState()
    expect(state.items).toHaveLength(1)
    expect(state.items[0].quantity).toBe(2)
  })

  it('removes item', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().addItem(mockProduct2)
    useCartStore.getState().removeItem('prod-1')
    const state = useCartStore.getState()
    expect(state.items).toHaveLength(1)
    expect(state.items[0].productId).toBe('prod-2')
  })

  it('updates quantity', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().updateQuantity('prod-1', 5)
    expect(useCartStore.getState().items[0].quantity).toBe(5)
  })

  it('removes item when qty set to 0', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().updateQuantity('prod-1', 0)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('clears cart', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().addItem(mockProduct2)
    useCartStore.getState().setCustomer('cust-1')
    useCartStore.getState().clear()
    const state = useCartStore.getState()
    expect(state.items).toHaveLength(0)
    expect(state.customerId).toBeNull()
  })

  it('computes subtotal correctly', () => {
    useCartStore.getState().addItem(mockProduct) // 350 * (1 - 0.10) * 1 = 315
    useCartStore.getState().addItem(mockProduct2) // 1500 * 1 * 1 = 1500
    const subtotal = selectSubtotal(useCartStore.getState())
    expect(subtotal).toBe(315 + 1500)
  })

  it('computes item count', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().addItem(mockProduct2)
    expect(selectItemCount(useCartStore.getState())).toBe(3) // 2 + 1
  })

  it('sets customer', () => {
    useCartStore.getState().setCustomer('cust-123')
    expect(useCartStore.getState().customerId).toBe('cust-123')
  })

  it('sets additional discount', () => {
    useCartStore.getState().setAdditionalDiscount(100, 0)
    expect(useCartStore.getState().additionalDiscountAmount).toBe(100)
  })
})
