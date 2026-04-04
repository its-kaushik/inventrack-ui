import { http, HttpResponse } from 'msw'
import {
  mockProducts,
  mockCategories,
  mockBrands,
  mockSubTypes,
  mockSizeSystems,
  mockSuppliers,
  mockCustomers,
  mockBills,
  mockPurchases,
  mockStockItems,
  mockCashRegister,
  mockCashRegisterHistory,
  mockDashboardData,
  mockUser,
  mockTenant,
  mockTenantSettings,
  mockUsers,
  mockNotifications,
  mockLabelTemplates,
  generateMockLedger,
} from './data'

import type { Product, Bill, Customer, Supplier, Purchase, User } from '@/types/models'

const API_BASE = '/api/v1'

// ── Mutable state (allows create/update in dev) ─────────

const products = [...mockProducts]
const bills = [...mockBills]
const customers = [...mockCustomers]
const suppliers = [...mockSuppliers]
const purchases = [...mockPurchases]
const users = [...mockUsers]
const notifications = [...mockNotifications]
let idCounter = 10000

function nextId(prefix: string): string {
  idCounter++
  return `${prefix}-${String(idCounter)}`
}

// ── Helpers ──────────────────────────────────────────────

function paginate<T>(items: T[], url: URL): { items: T[]; hasMore: boolean } {
  const limit = parseInt(url.searchParams.get('limit') ?? '20', 10)
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10)
  const sliced = items.slice(offset, offset + limit)
  return { items: sliced, hasMore: offset + limit < items.length }
}

function ok<T>(data: T) {
  return HttpResponse.json({ success: true, data, error: null })
}

function err(code: string, message: string, status: number = 400) {
  return HttpResponse.json({ success: false, data: null, error: { code, message } }, { status })
}

// ── Auth Handlers ────────────────────────────────────────

const authHandlers = [
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { phone?: string; password?: string }
    if (body.phone === '9876543210' && body.password === 'password123') {
      return ok({ accessToken: 'mock-access-token', user: mockUser, tenant: mockTenant })
    }
    return err('UNAUTHORIZED', 'Invalid phone number or password', 401)
  }),

  http.post(`${API_BASE}/auth/refresh`, () => {
    return ok({ accessToken: 'mock-access-token-refreshed' })
  }),

  http.get(`${API_BASE}/auth/me`, () => {
    return ok({ user: mockUser, tenant: mockTenant })
  }),

  http.post(`${API_BASE}/auth/logout`, () => {
    return ok(null)
  }),

  http.post(`${API_BASE}/auth/forgot-password`, () => {
    return ok(null)
  }),

  http.post(`${API_BASE}/auth/reset-password`, () => {
    return ok(null)
  }),

  http.post(`${API_BASE}/auth/verify-otp`, () => {
    return ok({ accessToken: 'mock-access-token', user: mockUser })
  }),

  http.post(`${API_BASE}/auth/resend-otp`, () => {
    return ok(null)
  }),
]

// ── Product Handlers ─────────────────────────────────────

const productHandlers = [
  http.get(`${API_BASE}/products`, ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase()
    const categoryId = url.searchParams.get('category_id')
    const brandId = url.searchParams.get('brand_id')
    const isActive = url.searchParams.get('is_active')

    let filtered = products
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search) ||
          p.barcode.includes(search),
      )
    }
    if (categoryId) filtered = filtered.filter((p) => p.categoryId === categoryId)
    if (brandId) filtered = filtered.filter((p) => p.brandId === brandId)
    if (isActive !== null && isActive !== undefined) {
      filtered = filtered.filter((p) => p.isActive === (isActive === 'true'))
    }

    return ok(paginate(filtered, url))
  }),

  http.get(`${API_BASE}/products/search`, ({ request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.toLowerCase() ?? ''
    if (!q) return ok([])

    const results = products
      .filter(
        (p) => p.barcode === q || p.sku.toLowerCase() === q || p.name.toLowerCase().includes(q),
      )
      .slice(0, 20)

    return ok(results)
  }),

  http.get(`${API_BASE}/products/:id`, ({ params }) => {
    const product = products.find((p) => p.id === params['id'])
    if (!product) return err('NOT_FOUND', 'Product not found', 404)
    return ok(product)
  }),

  http.post(`${API_BASE}/products`, async ({ request }) => {
    const body = (await request.json()) as Partial<Product>
    const newProduct: Product = {
      id: nextId('prod'),
      tenantId: 'tenant-1',
      name: body.name ?? '',
      sku: body.sku ?? '',
      barcode: body.barcode ?? `89000${String(idCounter).padStart(8, '0')}`,
      categoryId: body.categoryId ?? 'cat-1',
      subTypeId: body.subTypeId ?? null,
      brandId: body.brandId ?? null,
      size: body.size ?? null,
      color: body.color ?? null,
      hsnCode: body.hsnCode ?? null,
      gstRate: body.gstRate ?? 5,
      sellingPrice: body.sellingPrice ?? 0,
      costPrice: body.costPrice ?? 0,
      mrp: body.mrp ?? null,
      catalogDiscountPct: body.catalogDiscountPct ?? 0,
      minStockLevel: body.minStockLevel ?? 10,
      reorderPoint: body.reorderPoint ?? null,
      description: body.description ?? null,
      imageUrls: body.imageUrls ?? [],
      isActive: true,
      currentStock: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    products.unshift(newProduct)
    return ok(newProduct)
  }),

  http.put(`${API_BASE}/products/:id`, async ({ params, request }) => {
    const idx = products.findIndex((p) => p.id === params['id'])
    if (idx === -1) return err('NOT_FOUND', 'Product not found', 404)
    const body = (await request.json()) as Partial<Product>
    products[idx] = { ...products[idx]!, ...body, updatedAt: new Date().toISOString() }
    return ok(products[idx])
  }),

  http.delete(`${API_BASE}/products/:id`, ({ params }) => {
    const idx = products.findIndex((p) => p.id === params['id'])
    if (idx === -1) return err('NOT_FOUND', 'Product not found', 404)
    products.splice(idx, 1)
    return ok(null)
  }),

  http.post(`${API_BASE}/products/:id/barcode`, ({ params }) => {
    const product = products.find((p) => p.id === params['id'])
    if (!product) return err('NOT_FOUND', 'Product not found', 404)
    return ok({ barcode: product.barcode })
  }),

  http.get(`${API_BASE}/products/import/:jobId/status`, ({ params }) => {
    return ok({ jobId: params['jobId'], status: 'completed', progress: 100 })
  }),
]

// ── Category / SubType / SizeSystem / Brand Handlers ─────

const catalogHandlers = [
  // Categories
  http.get(`${API_BASE}/categories`, () => {
    return ok(mockCategories)
  }),

  http.post(`${API_BASE}/categories`, async ({ request }) => {
    const body = (await request.json()) as { name: string; code: string; sortOrder?: number }
    const cat = {
      id: nextId('cat'),
      name: body.name,
      code: body.code,
      sortOrder: body.sortOrder ?? mockCategories.length + 1,
      isActive: true,
    }
    return ok(cat)
  }),

  http.patch(`${API_BASE}/categories/:id`, async ({ params, request }) => {
    const cat = mockCategories.find((c) => c.id === params['id'])
    if (!cat) return err('NOT_FOUND', 'Category not found', 404)
    const body = (await request.json()) as Partial<typeof cat>
    return ok({ ...cat, ...body })
  }),

  http.delete(`${API_BASE}/categories/:id`, () => {
    return ok(null)
  }),

  // Sub-Types
  http.get(`${API_BASE}/categories/:categoryId/sub-types`, ({ params }) => {
    const filtered = mockSubTypes.filter((st) => st.categoryId === params['categoryId'])
    return ok(filtered)
  }),

  http.post(`${API_BASE}/sub-types`, async ({ request }) => {
    const body = (await request.json()) as { categoryId: string; name: string; code: string }
    return ok({
      id: nextId('st'),
      categoryId: body.categoryId,
      name: body.name,
      code: body.code,
    })
  }),

  http.patch(`${API_BASE}/sub-types/:id`, async ({ params, request }) => {
    const st = mockSubTypes.find((s) => s.id === params['id'])
    if (!st) return err('NOT_FOUND', 'SubType not found', 404)
    const body = (await request.json()) as Partial<typeof st>
    return ok({ ...st, ...body })
  }),

  // Size Systems
  http.get(`${API_BASE}/size-systems`, () => {
    return ok(mockSizeSystems)
  }),

  http.post(`${API_BASE}/size-systems`, async ({ request }) => {
    const body = (await request.json()) as { name: string; values: string[] }
    return ok({ id: nextId('ss'), name: body.name, values: body.values })
  }),

  http.patch(`${API_BASE}/size-systems/:id`, async ({ params, request }) => {
    const ss = mockSizeSystems.find((s) => s.id === params['id'])
    if (!ss) return err('NOT_FOUND', 'Size system not found', 404)
    const body = (await request.json()) as Partial<typeof ss>
    return ok({ ...ss, ...body })
  }),

  // Brands
  http.get(`${API_BASE}/brands`, () => {
    return ok(mockBrands)
  }),

  http.post(`${API_BASE}/brands`, async ({ request }) => {
    const body = (await request.json()) as { name: string; code: string }
    return ok({ id: nextId('br'), name: body.name, code: body.code })
  }),

  http.patch(`${API_BASE}/brands/:id`, async ({ params, request }) => {
    const brand = mockBrands.find((b) => b.id === params['id'])
    if (!brand) return err('NOT_FOUND', 'Brand not found', 404)
    const body = (await request.json()) as Partial<typeof brand>
    return ok({ ...brand, ...body })
  }),
]

// ── Bill Handlers ────────────────────────────────────────

const billHandlers = [
  http.get(`${API_BASE}/bills`, ({ request }) => {
    const url = new URL(request.url)
    const customerId = url.searchParams.get('customer_id')
    const salespersonId = url.searchParams.get('salesperson_id')
    const status = url.searchParams.get('status')

    let filtered = bills
    if (customerId) filtered = filtered.filter((b) => b.customerId === customerId)
    if (salespersonId) filtered = filtered.filter((b) => b.salespersonId === salespersonId)
    if (status) filtered = filtered.filter((b) => b.status === status)

    return ok(paginate(filtered, url))
  }),

  http.get(`${API_BASE}/bills/:id`, ({ params }) => {
    const bill = bills.find((b) => b.id === params['id'])
    if (!bill) return err('NOT_FOUND', 'Bill not found', 404)
    return ok(bill)
  }),

  http.get(`${API_BASE}/bills/:id/print`, ({ params }) => {
    const bill = bills.find((b) => b.id === params['id'])
    if (!bill) return err('NOT_FOUND', 'Bill not found', 404)
    return ok(bill)
  }),

  http.post(`${API_BASE}/bills`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const billItems = (body['items'] as Array<{ productId: string; quantity: number }>) ?? []

    const resolvedItems = billItems.map((item, idx) => {
      const prod = products.find((p) => p.id === item.productId)
      const price = prod?.sellingPrice ?? 0
      const lineTotal = price * item.quantity
      return {
        id: nextId('bi'),
        billId: '',
        productId: item.productId,
        productName: prod?.name ?? 'Unknown',
        sku: prod?.sku ?? '',
        size: prod?.size ?? null,
        quantity: item.quantity,
        unitPrice: String(price),
        catalogDiscountPct: 0,
        lineTotal: String(lineTotal),
        gstRate: prod?.gstRate ?? 5,
        gstAmount: String(Math.round((lineTotal * (prod?.gstRate ?? 5)) / 100)),
        _idx: idx,
      }
    })

    const subtotal = resolvedItems.reduce((sum, i) => sum + Number(i.lineTotal), 0)
    const taxAmount = resolvedItems.reduce((sum, i) => sum + Number(i.gstAmount), 0)
    const netAmount = subtotal + taxAmount

    const newBill: Bill = {
      id: nextId('bill'),
      tenantId: 'tenant-1',
      billNumber: `SKG-2026-${String(bills.length + 1).padStart(5, '0')}`,
      customerId: (body['customerId'] as string) ?? null,
      salespersonId: mockUser.id,
      subtotal: String(subtotal),
      catalogDiscountTotal: '0',
      additionalDiscountAmount: String(body['additionalDiscountAmount'] ?? 0),
      taxAmount: String(taxAmount),
      netAmount: String(netAmount),
      gstSchemeAtSale: 'composition',
      status: 'completed',
      notes: (body['notes'] as string) ?? null,
      createdAt: new Date().toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      items: resolvedItems.map(({ _idx, ...rest }) => rest),
      payments: (
        (body['payments'] as Array<{ mode: string; amount: number; reference?: string }>) ?? []
      ).map((p) => ({
        id: nextId('bp'),
        billId: '',
        mode: p.mode as Bill['payments'] extends Array<infer I>
          ? I extends { mode: infer M }
            ? M
            : never
          : never,
        amount: String(p.amount),
        reference: p.reference ?? null,
      })),
    }

    bills.unshift(newBill)
    return ok(newBill)
  }),

  http.post(`${API_BASE}/bills/:id/void`, ({ params }) => {
    const bill = bills.find((b) => b.id === params['id'])
    if (!bill) return err('NOT_FOUND', 'Bill not found', 404)
    bill.status = 'voided'
    return ok(bill)
  }),

  http.post(`${API_BASE}/bills/sync`, () => {
    return ok({ synced: [], conflicts: [] })
  }),

  // Returns
  http.get(`${API_BASE}/bills/:id/returnable`, ({ params }) => {
    const bill = bills.find((b) => b.id === params['id'])
    if (!bill) return err('NOT_FOUND', 'Bill not found', 404)
    const items = (bill.items ?? []).map((item) => ({
      billItemId: item.id,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      size: item.size,
      originalQuantity: item.quantity,
      returnedQuantity: 0,
      returnableQuantity: item.quantity,
      unitPrice: item.unitPrice,
      catalogDiscountPct: item.catalogDiscountPct,
    }))
    return ok({ bill, items })
  }),

  http.post(`${API_BASE}/bills/:id/return`, () => {
    return ok({ returnId: nextId('ret'), refundAmount: 500 })
  }),
]

// ── Stock Handlers ───────────────────────────────────────

const stockHandlers = [
  http.get(`${API_BASE}/stock`, ({ request }) => {
    const url = new URL(request.url)
    const categoryId = url.searchParams.get('category_id')
    const status = url.searchParams.get('status')

    let filtered = mockStockItems
    if (categoryId) {
      const catProducts = new Set(
        products.filter((p) => p.categoryId === categoryId).map((p) => p.id),
      )
      filtered = filtered.filter((s) => catProducts.has(s.id))
    }
    if (status) filtered = filtered.filter((s) => s.status === status)

    const summary = {
      total: filtered.length,
      inStock: filtered.filter((s) => s.status === 'healthy').length,
      low: filtered.filter((s) => s.status === 'low').length,
      out: filtered.filter((s) => s.status === 'out').length,
    }

    const paged = paginate(filtered, url)
    return ok({ ...paged, summary })
  }),

  http.get(`${API_BASE}/stock/:productId`, ({ params }) => {
    const item = mockStockItems.find((s) => s.id === params['productId'])
    if (!item) return err('NOT_FOUND', 'Stock item not found', 404)
    return ok(item)
  }),

  http.get(`${API_BASE}/stock/:productId/history`, ({ params }) => {
    const productId = params['productId'] as string
    const history = Array.from({ length: 10 }, (_, i) => ({
      id: `sh-${productId}-${i + 1}`,
      type: i % 3 === 0 ? 'purchase' : i % 3 === 1 ? 'sale' : 'adjustment',
      quantity: i % 3 === 1 ? -((((i + 1) * 2) % 10) + 1) : (((i + 1) * 3) % 20) + 5,
      referenceId:
        i % 3 === 0
          ? `pur-${String((i % 30) + 1).padStart(3, '0')}`
          : i % 3 === 1
            ? `bill-${String((i % 100) + 1).padStart(3, '0')}`
            : null,
      createdAt: `2026-03-${String((i % 28) + 1).padStart(2, '0')}T10:00:00Z`,
    }))
    return ok(history)
  }),
]

// ── Customer Handlers ────────────────────────────────────

const customerHandlers = [
  http.get(`${API_BASE}/customers`, ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase()
    const withBalance = url.searchParams.get('with_balance')

    let filtered = customers
    if (search) {
      filtered = filtered.filter(
        (c) => c.name.toLowerCase().includes(search) || c.phone.includes(search),
      )
    }
    if (withBalance === 'true') {
      filtered = filtered.filter((c) => Number(c.outstandingBalance ?? 0) > 0)
    }

    return ok(paginate(filtered, url))
  }),

  http.get(`${API_BASE}/customers/search`, ({ request }) => {
    const url = new URL(request.url)
    const phone = url.searchParams.get('phone') ?? ''
    const results = customers.filter((c) => c.phone.includes(phone)).slice(0, 10)
    return ok(results)
  }),

  http.get(`${API_BASE}/customers/:id`, ({ params }) => {
    const customer = customers.find((c) => c.id === params['id'])
    if (!customer) return err('NOT_FOUND', 'Customer not found', 404)
    return ok(customer)
  }),

  http.post(`${API_BASE}/customers`, async ({ request }) => {
    const body = (await request.json()) as Partial<Customer>
    const newCustomer: Customer = {
      id: nextId('cust'),
      tenantId: 'tenant-1',
      name: body.name ?? '',
      phone: body.phone ?? '',
      email: body.email ?? null,
      address: body.address ?? null,
      outstandingBalance: '0',
      createdAt: new Date().toISOString(),
    }
    customers.unshift(newCustomer)
    return ok(newCustomer)
  }),

  http.put(`${API_BASE}/customers/:id`, async ({ params, request }) => {
    const idx = customers.findIndex((c) => c.id === params['id'])
    if (idx === -1) return err('NOT_FOUND', 'Customer not found', 404)
    const body = (await request.json()) as Partial<Customer>
    customers[idx] = { ...customers[idx]!, ...body }
    return ok(customers[idx])
  }),

  http.get(`${API_BASE}/customers/:id/ledger`, ({ params, request }) => {
    const url = new URL(request.url)
    const entries = generateMockLedger(params['id'] as string)
    return ok(paginate(entries, url))
  }),

  http.post(`${API_BASE}/customers/:id/payments`, () => {
    return ok(null)
  }),
]

// ── Supplier Handlers ────────────────────────────────────

const supplierHandlers = [
  http.get(`${API_BASE}/suppliers`, ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase()

    let filtered = suppliers
    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          (s.contactPerson?.toLowerCase().includes(search) ?? false),
      )
    }

    return ok(filtered)
  }),

  http.get(`${API_BASE}/suppliers/:id`, ({ params }) => {
    const supplier = suppliers.find((s) => s.id === params['id'])
    if (!supplier) return err('NOT_FOUND', 'Supplier not found', 404)
    return ok(supplier)
  }),

  http.post(`${API_BASE}/suppliers`, async ({ request }) => {
    const body = (await request.json()) as Partial<Supplier>
    const newSupplier: Supplier = {
      id: nextId('sup'),
      tenantId: 'tenant-1',
      name: body.name ?? '',
      contactPerson: body.contactPerson ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      address: body.address ?? null,
      gstin: body.gstin ?? null,
      paymentTerms: body.paymentTerms ?? null,
      notes: body.notes ?? null,
      outstandingBalance: '0',
      createdAt: new Date().toISOString(),
    }
    suppliers.unshift(newSupplier)
    return ok(newSupplier)
  }),

  http.put(`${API_BASE}/suppliers/:id`, async ({ params, request }) => {
    const idx = suppliers.findIndex((s) => s.id === params['id'])
    if (idx === -1) return err('NOT_FOUND', 'Supplier not found', 404)
    const body = (await request.json()) as Partial<Supplier>
    suppliers[idx] = { ...suppliers[idx]!, ...body }
    return ok(suppliers[idx])
  }),

  http.get(`${API_BASE}/suppliers/:id/ledger`, ({ params, request }) => {
    const url = new URL(request.url)
    const entries = generateMockLedger(params['id'] as string)
    return ok(paginate(entries, url))
  }),

  http.post(`${API_BASE}/suppliers/:id/payments`, () => {
    return ok(null)
  }),

  http.get(`${API_BASE}/suppliers/:id/products`, ({ params }) => {
    // Return some products that "belong" to this supplier
    const suppIdx = suppliers.findIndex((s) => s.id === params['id'])
    const subset = products.slice(suppIdx * 10, suppIdx * 10 + 15)
    return ok(subset)
  }),
]

// ── Purchase Handlers ────────────────────────────────────

const purchaseHandlers = [
  http.get(`${API_BASE}/purchases`, ({ request }) => {
    const url = new URL(request.url)
    const supplierId = url.searchParams.get('supplier_id')

    let filtered = purchases
    if (supplierId) filtered = filtered.filter((p) => p.supplierId === supplierId)

    return ok(paginate(filtered, url))
  }),

  http.get(`${API_BASE}/purchases/:id`, ({ params }) => {
    const purchase = purchases.find((p) => p.id === params['id'])
    if (!purchase) return err('NOT_FOUND', 'Purchase not found', 404)
    return ok(purchase)
  }),

  http.post(`${API_BASE}/purchases`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const newPurchase: Purchase = {
      id: nextId('pur'),
      tenantId: 'tenant-1',
      supplierId: (body['supplierId'] as string) ?? '',
      invoiceNumber: (body['invoiceNumber'] as string) ?? null,
      invoiceDate: (body['invoiceDate'] as string) ?? null,
      invoiceImageUrl: null,
      totalAmount: String(body['totalAmount'] ?? 0),
      cgstAmount: body['cgstAmount'] ? String(body['cgstAmount']) : null,
      sgstAmount: body['sgstAmount'] ? String(body['sgstAmount']) : null,
      igstAmount: body['igstAmount'] ? String(body['igstAmount']) : null,
      isRcm: (body['isRcm'] as boolean) ?? false,
      createdAt: new Date().toISOString(),
      items: [],
    }
    purchases.unshift(newPurchase)
    return ok(newPurchase)
  }),
]

// ── Cash Register Handlers ───────────────────────────────

const cashRegisterHandlers = [
  http.get(`${API_BASE}/cash-register/current`, () => {
    return ok(mockCashRegister)
  }),

  http.get(`${API_BASE}/cash-register/history`, () => {
    return ok(mockCashRegisterHistory)
  }),

  http.get(`${API_BASE}/cash-register/:id`, ({ params }) => {
    const reg = mockCashRegisterHistory.find((r) => r.id === params['id'])
    if (!reg) return err('NOT_FOUND', 'Register not found', 404)
    return ok(reg)
  }),

  http.post(`${API_BASE}/cash-register/open`, async ({ request }) => {
    const body = (await request.json()) as { openingBalance: number }
    return ok({
      ...mockCashRegister,
      id: nextId('cr'),
      openingBalance: String(body.openingBalance),
      currentBalance: String(body.openingBalance),
      openedAt: new Date().toISOString(),
    })
  }),

  http.post(`${API_BASE}/cash-register/:id/close`, async ({ request }) => {
    const body = (await request.json()) as { actualClosing: number }
    return ok({
      ...mockCashRegister,
      status: 'closed' as const,
      calculatedClosing: mockCashRegister.currentBalance,
      actualClosing: String(body.actualClosing),
      discrepancy: String(body.actualClosing - Number(mockCashRegister.currentBalance ?? 0)),
      closedAt: new Date().toISOString(),
    })
  }),
]

// ── Dashboard Handler ────────────────────────────────────

const dashboardHandlers = [
  http.get(`${API_BASE}/dashboard`, () => {
    return ok(mockDashboardData)
  }),
]

// ── Settings Handlers ────────────────────────────────────

const settingsHandlers = [
  http.get(`${API_BASE}/settings`, () => {
    return ok(mockTenantSettings)
  }),

  http.patch(`${API_BASE}/settings`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return ok({ ...mockTenantSettings, ...body })
  }),

  http.get(`${API_BASE}/settings/store`, () => {
    return ok(mockTenant)
  }),

  http.patch(`${API_BASE}/settings/store`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return ok({ ...mockTenant, ...body })
  }),

  // Setup
  http.post(`${API_BASE}/setup/tenant`, () => {
    return ok({ tenant: mockTenant, owner: mockUser })
  }),

  http.put(`${API_BASE}/setup/wizard`, () => {
    return ok(null)
  }),
]

// ── User Handlers ────────────────────────────────────────

const userHandlers = [
  http.get(`${API_BASE}/users`, () => {
    return ok(users)
  }),

  http.get(`${API_BASE}/users/:id`, ({ params }) => {
    const user = users.find((u) => u.id === params['id'])
    if (!user) return err('NOT_FOUND', 'User not found', 404)
    return ok(user)
  }),

  http.post(`${API_BASE}/users`, async ({ request }) => {
    const body = (await request.json()) as Partial<User>
    const newUser: User = {
      id: nextId('user'),
      tenantId: 'tenant-1',
      name: body.name ?? '',
      phone: body.phone ?? '',
      email: body.email ?? null,
      role: body.role ?? 'salesperson',
      isActive: true,
      tenant: mockTenant,
    }
    users.push(newUser)
    return ok(newUser)
  }),

  http.patch(`${API_BASE}/users/:id`, async ({ params, request }) => {
    const idx = users.findIndex((u) => u.id === params['id'])
    if (idx === -1) return err('NOT_FOUND', 'User not found', 404)
    const body = (await request.json()) as Partial<User>
    users[idx] = { ...users[idx]!, ...body }
    return ok(users[idx])
  }),

  http.post(`${API_BASE}/users/:id/reset-password`, () => {
    return ok(null)
  }),
]

// ── Label Handlers ───────────────────────────────────────

const labelHandlers = [
  http.post(`${API_BASE}/labels/generate`, async ({ request }) => {
    const body = (await request.json()) as {
      items: Array<{ productId: string; quantity: number }>
    }
    const labelItems = body.items.map((item) => {
      const prod = products.find((p) => p.id === item.productId)
      return {
        productName: prod?.name ?? 'Unknown',
        sku: prod?.sku ?? '',
        barcode: prod?.barcode ?? '',
        size: prod?.size ?? null,
        sellingPrice: String(prod?.sellingPrice ?? 0),
        quantity: item.quantity,
        barcodeDataUrl: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`,
      }
    })
    return ok(labelItems)
  }),

  http.get(`${API_BASE}/labels/templates`, () => {
    return ok(mockLabelTemplates)
  }),
]

// ── Upload Handlers ──────────────────────────────────────

const uploadHandlers = [
  http.post(`${API_BASE}/uploads/presign`, async ({ request }) => {
    const body = (await request.json()) as { fileName: string }
    return ok({
      url: `https://storage.example.com/uploads/${body.fileName}?token=mock`,
      key: `uploads/${body.fileName}`,
    })
  }),
]

// ── Notification Handlers ────────────────────────────────

const notificationHandlers = [
  http.get(`${API_BASE}/notifications/unread-count`, () => {
    const count = notifications.filter((n) => !n.read).length
    return ok({ count })
  }),

  http.get(`${API_BASE}/notifications`, ({ request }) => {
    const url = new URL(request.url)
    return ok(paginate(notifications, url))
  }),

  http.post(`${API_BASE}/notifications/:id/read`, ({ params }) => {
    const notif = notifications.find((n) => n.id === params['id'])
    if (notif) notif.read = true
    return ok(null)
  }),

  http.post(`${API_BASE}/notifications/read-all`, () => {
    notifications.forEach((n) => {
      n.read = true
    })
    return ok(null)
  }),
]

// ── Signup Handler ───────────────────────────────────────

const signupHandlers = [
  http.post(`${API_BASE}/signup`, () => {
    return ok({ tenant: mockTenant, owner: mockUser, accessToken: 'mock-access-token' })
  }),
]

// ── Phase 2 stubs (purchase-orders, returns, adjustments, audits, expenses, sales, gst, pnl, reports, audit-log) ──

const phase2Handlers = [
  // Purchase Orders
  http.get(`${API_BASE}/purchase-orders`, ({ request }) => {
    const url = new URL(request.url)
    return ok(paginate([], url))
  }),
  http.get(`${API_BASE}/purchase-orders/:id`, () => {
    return err('NOT_FOUND', 'Purchase order not found', 404)
  }),
  http.post(`${API_BASE}/purchase-orders`, () => {
    return ok({ id: nextId('po'), status: 'draft' })
  }),

  // Purchase Returns
  http.get(`${API_BASE}/purchase-returns`, ({ request }) => {
    const url = new URL(request.url)
    return ok(paginate([], url))
  }),
  http.get(`${API_BASE}/purchase-returns/:id`, () => {
    return err('NOT_FOUND', 'Purchase return not found', 404)
  }),
  http.post(`${API_BASE}/purchase-returns`, () => {
    return ok({ id: nextId('pr') })
  }),

  // Stock Adjustments
  http.get(`${API_BASE}/stock-adjustments`, ({ request }) => {
    const url = new URL(request.url)
    return ok(paginate([], url))
  }),
  http.post(`${API_BASE}/stock-adjustments`, () => {
    return ok({ id: nextId('sa') })
  }),

  // Stock Audits
  http.get(`${API_BASE}/stock-audits`, ({ request }) => {
    const url = new URL(request.url)
    return ok(paginate([], url))
  }),
  http.get(`${API_BASE}/stock-audits/:id`, () => {
    return err('NOT_FOUND', 'Audit not found', 404)
  }),
  http.post(`${API_BASE}/stock-audits`, () => {
    return ok({ id: nextId('audit') })
  }),

  // Expenses
  http.get(`${API_BASE}/expenses`, ({ request }) => {
    const url = new URL(request.url)
    return ok(paginate([], url))
  }),
  http.get(`${API_BASE}/expenses/categories`, () => {
    return ok([
      { id: 'ec-1', name: 'Rent' },
      { id: 'ec-2', name: 'Electricity' },
      { id: 'ec-3', name: 'Staff Salary' },
      { id: 'ec-4', name: 'Tea & Snacks' },
      { id: 'ec-5', name: 'Transport' },
      { id: 'ec-6', name: 'Miscellaneous' },
    ])
  }),
  http.post(`${API_BASE}/expenses`, () => {
    return ok({ id: nextId('exp') })
  }),

  // Sales overview
  http.get(`${API_BASE}/sales/overview`, () => {
    return ok({
      totalSales: 345000,
      totalBills: 120,
      avgBillValue: 2875,
      trend: Array.from({ length: 30 }, (_, i) => ({
        date: `2026-03-${String(i + 1).padStart(2, '0')}`,
        amount: 10000 + ((i * 317) % 8000),
        count: 3 + ((i * 7) % 10),
      })),
      byCategory: mockCategories.map((c, i) => ({
        categoryId: c.id,
        categoryName: c.name,
        total: 30000 + i * 5000,
        count: 10 + i * 3,
      })),
      byBrand: mockBrands.map((b, i) => ({
        brandId: b.id,
        brandName: b.name,
        total: 25000 + i * 4000,
        count: 8 + i * 2,
      })),
      bySalesperson: mockUsers
        .filter((u) => u.role === 'salesperson' || u.role === 'owner')
        .map((u, i) => ({
          userId: u.id,
          userName: u.name,
          total: 80000 + i * 15000,
          count: 25 + i * 5,
        })),
    })
  }),

  // GST
  http.get(`${API_BASE}/gst/dashboard`, () => {
    return ok({
      scheme: 'composition',
      period: '2025-26 Q4',
      totalTurnover: 345000,
      compositionTax: 3450,
    })
  }),
  http.get(`${API_BASE}/gst/returns/:type`, () => {
    return ok({
      returnType: 'cmp-08',
      period: '2025-26 Q4',
      data: [],
      columns: [],
    })
  }),
  http.get(`${API_BASE}/gst/itc`, ({ request }) => {
    const url = new URL(request.url)
    return ok(paginate([], url))
  }),

  // Profit & Loss
  http.get(`${API_BASE}/pnl`, () => {
    return ok({
      period: { from: '2026-03-01', to: '2026-03-31' },
      revenue: 345000,
      cogs: 207000,
      grossProfit: 138000,
      expenses: [
        { category: 'Rent', amount: 15000 },
        { category: 'Electricity', amount: 3500 },
        { category: 'Staff Salary', amount: 45000 },
        { category: 'Miscellaneous', amount: 5000 },
      ],
      totalExpenses: 68500,
      netProfit: 69500,
    })
  }),

  // Reports
  http.get(`${API_BASE}/reports/:type`, () => {
    return ok({
      type: 'daily-sales',
      title: 'Daily Sales Report',
      columns: [
        { key: 'date', header: 'Date' },
        { key: 'bills', header: 'Bills' },
        { key: 'total', header: 'Total', align: 'right' as const },
      ],
      rows: Array.from({ length: 30 }, (_, i) => ({
        date: `2026-03-${String(i + 1).padStart(2, '0')}`,
        bills: 3 + ((i * 7) % 10),
        total: 10000 + ((i * 317) % 8000),
      })),
      summary: { totalBills: 120, totalRevenue: 345000 },
    })
  }),

  // Audit Log
  http.get(`${API_BASE}/audit`, ({ request }) => {
    const url = new URL(request.url)
    return ok(paginate([], url))
  }),
]

// ── Admin Handlers (super_admin) ─────────────────────────

const adminHandlers = [
  http.get(`${API_BASE}/admin/dashboard`, () => {
    return ok({
      totalTenants: 42,
      activeTenants: 35,
      trialTenants: 7,
      totalUsers: 156,
      totalRevenue: 125000,
      growthData: Array.from({ length: 6 }, (_, i) => ({
        month: `2026-${String(i + 1).padStart(2, '0')}`,
        tenants: 30 + i * 3,
        revenue: 80000 + i * 10000,
      })),
      recentSignups: [],
    })
  }),

  http.get(`${API_BASE}/admin/tenants`, ({ request }) => {
    const url = new URL(request.url)
    return ok(paginate([], url))
  }),

  http.get(`${API_BASE}/admin/tenants/:id`, () => {
    return err('NOT_FOUND', 'Tenant not found', 404)
  }),

  http.get(`${API_BASE}/admin/tenants/:id/usage`, () => {
    return ok({
      totalProducts: 500,
      totalBills: 1200,
      totalRevenue: 450000,
      totalUsers: 4,
      storageUsedMb: 25.5,
      lastBillAt: '2026-03-15T18:00:00Z',
      monthlyBillTrend: [],
    })
  }),

  http.post(`${API_BASE}/admin/tenants/:id/suspend`, () => ok(null)),
  http.post(`${API_BASE}/admin/tenants/:id/activate`, () => ok(null)),
  http.post(`${API_BASE}/admin/tenants/:id/extend-trial`, () => ok(null)),
  http.post(`${API_BASE}/admin/tenants/:id/plan`, () => ok(null)),
]

// ── Export all handlers ──────────────────────────────────

export const handlers = [
  ...authHandlers,
  ...productHandlers,
  ...catalogHandlers,
  ...billHandlers,
  ...stockHandlers,
  ...customerHandlers,
  ...supplierHandlers,
  ...purchaseHandlers,
  ...cashRegisterHandlers,
  ...dashboardHandlers,
  ...settingsHandlers,
  ...userHandlers,
  ...labelHandlers,
  ...uploadHandlers,
  ...notificationHandlers,
  ...signupHandlers,
  ...phase2Handlers,
  ...adminHandlers,
]
