// Mock data generator for InvenTrack — Indian clothing store
// All data is deterministic (index-based) so tests are reproducible.

import type {
  Product,
  Category,
  Brand,
  SizeSystem,
  SubType,
  Supplier,
  Customer,
  Bill,
  BillItem,
  BillPayment,
  DashboardData,
  User,
  Tenant,
  TenantSettings,
  CashRegister,
  CashRegisterEntry,
  StockItem,
  Purchase,
  PurchaseItem,
  LedgerEntry,
} from '@/types/models'
import type { Notification } from '@/api/notifications.api'

// ── Helpers ──────────────────────────────────────────────

function padId(n: number, width = 3): string {
  return String(n).padStart(width, '0')
}

function deterministicPick<T>(arr: readonly T[], index: number): T {
  return arr[index % arr.length]!
}

function deterministicPrice(base: number, range: number, index: number): number {
  // Produces a stable price within [base, base + range)
  const step = (index * 7 + 13) % range
  // Round to nearest 10
  return Math.round((base + step) / 10) * 10
}

// ── Categories ───────────────────────────────────────────

export const mockCategories: Category[] = [
  { id: 'cat-1', name: "Men's Vests", code: 'MVT', sortOrder: 1, isActive: true },
  { id: 'cat-2', name: "Men's Underwear", code: 'MUW', sortOrder: 2, isActive: true },
  { id: 'cat-3', name: 'Socks', code: 'SOC', sortOrder: 3, isActive: true },
  { id: 'cat-4', name: 'Jeans', code: 'JNS', sortOrder: 4, isActive: true },
  { id: 'cat-5', name: 'Shirts', code: 'SHR', sortOrder: 5, isActive: true },
  { id: 'cat-6', name: 'Kids Wear', code: 'KID', sortOrder: 6, isActive: true },
  { id: 'cat-7', name: 'Ethnic Wear', code: 'ETH', sortOrder: 7, isActive: true },
  { id: 'cat-8', name: 'Sarees', code: 'SAR', sortOrder: 8, isActive: true },
  { id: 'cat-9', name: 'T-Shirts', code: 'TSH', sortOrder: 9, isActive: true },
  { id: 'cat-10', name: 'Trousers', code: 'TRS', sortOrder: 10, isActive: true },
]

// ── Brands ───────────────────────────────────────────────

export const mockBrands: Brand[] = [
  { id: 'br-1', name: 'Rupa', code: 'RPA' },
  { id: 'br-2', name: 'Lux', code: 'LUX' },
  { id: 'br-3', name: 'Jockey', code: 'JCK' },
  { id: 'br-4', name: 'Dollar', code: 'DLR' },
  { id: 'br-5', name: 'VIP', code: 'VIP' },
  { id: 'br-6', name: 'Levis', code: 'LVS' },
  { id: 'br-7', name: 'Allen Solly', code: 'ALS' },
  { id: 'br-8', name: 'Peter England', code: 'PTE' },
]

// ── Sub-Types ────────────────────────────────────────────

export const mockSubTypes: SubType[] = [
  { id: 'st-1', categoryId: 'cat-1', name: 'RN', code: 'RN' },
  { id: 'st-2', categoryId: 'cat-1', name: 'RNS', code: 'RNS' },
  { id: 'st-3', categoryId: 'cat-1', name: 'Sports', code: 'SPR' },
  { id: 'st-4', categoryId: 'cat-2', name: 'Brief', code: 'BRF' },
  { id: 'st-5', categoryId: 'cat-2', name: 'Trunk', code: 'TRN' },
  { id: 'st-6', categoryId: 'cat-3', name: 'Ankle', code: 'ANK' },
  { id: 'st-7', categoryId: 'cat-3', name: 'Calf', code: 'CLF' },
  { id: 'st-8', categoryId: 'cat-4', name: 'Slim', code: 'SLM' },
  { id: 'st-9', categoryId: 'cat-4', name: 'Regular', code: 'REG' },
  { id: 'st-10', categoryId: 'cat-4', name: 'Straight', code: 'STR' },
  { id: 'st-11', categoryId: 'cat-5', name: 'Formal', code: 'FRM' },
  { id: 'st-12', categoryId: 'cat-5', name: 'Casual', code: 'CAS' },
  { id: 'st-13', categoryId: 'cat-6', name: 'Boys', code: 'BOY' },
  { id: 'st-14', categoryId: 'cat-6', name: 'Girls', code: 'GRL' },
  { id: 'st-15', categoryId: 'cat-7', name: 'Kurta', code: 'KRT' },
  { id: 'st-16', categoryId: 'cat-7', name: 'Pyjama Set', code: 'PYJ' },
  { id: 'st-17', categoryId: 'cat-8', name: 'Cotton', code: 'CTN' },
  { id: 'st-18', categoryId: 'cat-8', name: 'Silk', code: 'SLK' },
  { id: 'st-19', categoryId: 'cat-9', name: 'Round Neck', code: 'RNK' },
  { id: 'st-20', categoryId: 'cat-9', name: 'Polo', code: 'PLO' },
  { id: 'st-21', categoryId: 'cat-10', name: 'Formal', code: 'FRM' },
  { id: 'st-22', categoryId: 'cat-10', name: 'Casual', code: 'CAS' },
]

// ── Size Systems ─────────────────────────────────────────

export const mockSizeSystems: SizeSystem[] = [
  { id: 'ss-1', name: 'Garment (XS–XXL)', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  { id: 'ss-2', name: 'Waist (28–42)', values: ['28', '30', '32', '34', '36', '38', '40', '42'] },
  { id: 'ss-3', name: 'Kids (2Y–14Y)', values: ['2Y', '4Y', '6Y', '8Y', '10Y', '12Y', '14Y'] },
  { id: 'ss-4', name: 'Socks', values: ['Free Size'] },
  { id: 'ss-5', name: 'Saree', values: ['Free Size'] },
  { id: 'ss-6', name: 'Collar (38–44)', values: ['38', '39', '40', '41', '42', '43', '44'] },
]

// ── Price ranges & sizes per category ────────────────────

interface CategoryMeta {
  priceBase: number
  priceRange: number
  sizes: readonly string[]
  subTypeIds: readonly string[]
}

const categoryMeta: Record<string, CategoryMeta> = {
  'cat-1': {
    priceBase: 150,
    priceRange: 250,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    subTypeIds: ['st-1', 'st-2', 'st-3'],
  },
  'cat-2': {
    priceBase: 120,
    priceRange: 200,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    subTypeIds: ['st-4', 'st-5'],
  },
  'cat-3': { priceBase: 60, priceRange: 140, sizes: ['Free Size'], subTypeIds: ['st-6', 'st-7'] },
  'cat-4': {
    priceBase: 800,
    priceRange: 1700,
    sizes: ['28', '30', '32', '34', '36', '38'],
    subTypeIds: ['st-8', 'st-9', 'st-10'],
  },
  'cat-5': {
    priceBase: 500,
    priceRange: 1500,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    subTypeIds: ['st-11', 'st-12'],
  },
  'cat-6': {
    priceBase: 200,
    priceRange: 600,
    sizes: ['2Y', '4Y', '6Y', '8Y', '10Y', '12Y'],
    subTypeIds: ['st-13', 'st-14'],
  },
  'cat-7': {
    priceBase: 600,
    priceRange: 2400,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    subTypeIds: ['st-15', 'st-16'],
  },
  'cat-8': {
    priceBase: 500,
    priceRange: 4500,
    sizes: ['Free Size'],
    subTypeIds: ['st-17', 'st-18'],
  },
  'cat-9': {
    priceBase: 300,
    priceRange: 900,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    subTypeIds: ['st-19', 'st-20'],
  },
  'cat-10': {
    priceBase: 600,
    priceRange: 1400,
    sizes: ['28', '30', '32', '34', '36', '38', '40'],
    subTypeIds: ['st-21', 'st-22'],
  },
}

const colors = ['White', 'Black', 'Blue', 'Grey', 'Red', 'Navy', 'Brown', 'Green', 'Beige'] as const

// ── Product Generator ────────────────────────────────────

function generateMockProducts(count: number = 1000): Product[] {
  const products: Product[] = []
  const tenantId = 'tenant-1'
  const now = '2026-03-15T10:00:00Z'

  for (let i = 0; i < count; i++) {
    const category = deterministicPick(mockCategories, i)
    const brand = deterministicPick(mockBrands, i + 3)
    const meta = categoryMeta[category.id]!
    const subTypeId = deterministicPick(meta.subTypeIds, i + 1)
    const subType = mockSubTypes.find((st) => st.id === subTypeId)!
    const size = deterministicPick(meta.sizes, i + 2)
    const color = deterministicPick(colors, i + 5)

    const sellingPrice = deterministicPrice(meta.priceBase, meta.priceRange, i)
    const costPrice = Math.round((sellingPrice * 0.6) / 10) * 10
    const mrp = Math.round((sellingPrice * 1.2) / 10) * 10
    // GST: 5% for clothing <= 1000, 12% for > 1000
    const gstRate = sellingPrice <= 1000 ? 5 : 12

    const sku = `${category.code}-${brand.code}-${subType.code}-${size}-${padId(i + 1)}`
    const barcode = `89000${padId(i + 1, 8)}`

    const name = `${brand.name} ${subType.name} ${category.name.replace(/^(Men's |Women's )/, '')} - ${size}`

    const stock = (i * 17 + 5) % 101 // 0–100 deterministic
    const minStockLevel = 10

    products.push({
      id: `prod-${padId(i + 1, 6)}`,
      tenantId,
      name,
      sku,
      barcode,
      categoryId: category.id,
      subTypeId,
      brandId: brand.id,
      size,
      color,
      hsnCode: sellingPrice <= 1000 ? '6109' : '6203',
      gstRate,
      sellingPrice,
      costPrice,
      mrp,
      catalogDiscountPct: 0,
      minStockLevel,
      reorderPoint: 20,
      description: null,
      imageUrls: [],
      isActive: i % 25 !== 0 ? true : false, // ~4% inactive
      currentStock: stock,
      createdAt: now,
      updatedAt: now,
    })
  }

  return products
}

export const mockProducts: Product[] = generateMockProducts(1000)

// ── Tenant & User ────────────────────────────────────────

export const mockTenantSettings: TenantSettings = {
  low_stock_default_threshold: 10,
  aging_threshold_days: 90,
  return_window_days: 7,
  max_salesperson_discount_amount: 500,
  max_salesperson_discount_percent: 10,
  receipt_footer_text: 'Thank you for shopping with us!',
  receipt_header_text: 'Shri Krishna Garments',
  label_template_id: 'tpl-1',
}

export const mockTenant: Tenant = {
  id: 'tenant-1',
  name: 'Shri Krishna Garments',
  gstScheme: 'composition',
  gstin: '27AABCS1234A1ZQ',
  invoicePrefix: 'SKG',
  settings: mockTenantSettings,
  setupComplete: true,
}

export const mockUser: User = {
  id: 'user-1',
  tenantId: 'tenant-1',
  name: 'Ramesh Sharma',
  phone: '9876543210',
  email: 'ramesh@example.com',
  role: 'owner',
  isActive: true,
  setupComplete: true,
  tenant: mockTenant,
}

export const mockUsers: User[] = [
  mockUser,
  {
    id: 'user-2',
    tenantId: 'tenant-1',
    name: 'Suresh Patel',
    phone: '9876543211',
    email: 'suresh@example.com',
    role: 'manager',
    isActive: true,
    tenant: mockTenant,
  },
  {
    id: 'user-3',
    tenantId: 'tenant-1',
    name: 'Vikram Singh',
    phone: '9876543212',
    email: null,
    role: 'salesperson',
    isActive: true,
    tenant: mockTenant,
  },
  {
    id: 'user-4',
    tenantId: 'tenant-1',
    name: 'Amit Kumar',
    phone: '9876543213',
    email: null,
    role: 'salesperson',
    isActive: true,
    tenant: mockTenant,
  },
  {
    id: 'user-5',
    tenantId: 'tenant-1',
    name: 'Priya Gupta',
    phone: '9876543214',
    email: 'priya@example.com',
    role: 'salesperson',
    isActive: false,
    tenant: mockTenant,
  },
]

// ── Suppliers ────────────────────────────────────────────

const supplierNames = [
  { name: 'Rupa & Co. Ltd', person: 'Anil Agarwal', city: 'Kolkata' },
  { name: 'Lux Industries Ltd', person: 'Biplab Banerjee', city: 'Kolkata' },
  { name: 'Page Industries (Jockey)', person: 'Sunder Verma', city: 'Bangalore' },
  { name: 'Dollar Industries', person: 'Vinod Gupta', city: 'Kolkata' },
  { name: 'VIP Clothing Ltd', person: 'Rajesh Mehta', city: 'Mumbai' },
  { name: 'Levis Strauss India', person: 'Deepak Jain', city: 'Gurgaon' },
  { name: 'Madura Fashion (Allen Solly)', person: 'Karthik Iyer', city: 'Bangalore' },
  { name: 'Madura Fashion (Peter England)', person: 'Sanjay Mishra', city: 'Bangalore' },
  { name: 'Vardhman Textiles', person: 'Mohan Lal', city: 'Ludhiana' },
  { name: 'Arvind Ltd', person: 'Govind Patel', city: 'Ahmedabad' },
  { name: 'Bombay Dyeing', person: 'Nitin Shah', city: 'Mumbai' },
  { name: 'Raymond Ltd', person: 'Ashok Singhania', city: 'Mumbai' },
  { name: 'Welspun India', person: 'Prakash Deshmukh', city: 'Mumbai' },
  { name: 'KG Fabrics', person: 'Kalyan Goel', city: 'Surat' },
  { name: 'Shree Balaji Textiles', person: 'Bharat Agarwal', city: 'Surat' },
  { name: 'Nath Brothers', person: 'Sunil Nath', city: 'Delhi' },
  { name: 'Gopal Hosiery', person: 'Gopal Das', city: 'Tirupur' },
  { name: 'South India Textiles', person: 'Murali Krishnan', city: 'Coimbatore' },
  { name: 'Oswal Knit India', person: 'Ramesh Oswal', city: 'Ludhiana' },
  { name: 'JP Textiles', person: 'Jayant Pandey', city: 'Varanasi' },
]

export const mockSuppliers: Supplier[] = supplierNames.map((s, i) => ({
  id: `sup-${padId(i + 1)}`,
  tenantId: 'tenant-1',
  name: s.name,
  contactPerson: s.person,
  phone: `98${padId(i + 10, 8)}`,
  email: `${s.person.split(' ')[0]!.toLowerCase()}@${s.name.split(' ')[0]!.toLowerCase()}.com`,
  address: `${100 + i * 7}, Industrial Area, ${s.city}`,
  gstin: `27AABCS${padId(i + 1000, 4)}A1Z${String.fromCharCode(65 + (i % 26))}`,
  paymentTerms: deterministicPick(['Net 30', 'Net 15', 'Net 45', 'COD'] as const, i),
  notes: null,
  outstandingBalance: String((i * 3571 + 1000) % 50000),
  createdAt: '2026-01-10T08:00:00Z',
}))

// ── Customers ────────────────────────────────────────────

const customerNames = [
  'Rajesh Kumar',
  'Anita Devi',
  'Manoj Tiwari',
  'Sunita Yadav',
  'Ravi Shankar',
  'Pooja Mishra',
  'Arun Joshi',
  'Kavita Sharma',
  'Deepak Verma',
  'Neeta Singh',
  'Sanjay Gupta',
  'Meena Kumari',
  'Rakesh Pandey',
  'Geeta Devi',
  'Sunil Yadav',
  'Priyanka Tiwari',
  'Vijay Chauhan',
  'Asha Kumari',
  'Mukesh Agarwal',
  'Rekha Jain',
  'Ramesh Prasad',
  'Lakshmi Devi',
  'Kishore Sahu',
  'Usha Rani',
  'Naveen Kumar',
  'Suman Devi',
  'Pankaj Dubey',
  'Savita Singh',
  'Ashish Mishra',
  'Kiran Bala',
  'Gopal Sharma',
  'Rita Devi',
  'Suresh Yadav',
  'Manju Kumari',
  'Dinesh Tiwari',
  'Anita Gupta',
  'Rohit Verma',
  'Sapna Singh',
  'Ajay Pandey',
  'Sunaina Devi',
  'Alok Kumar',
  'Poonam Yadav',
  'Vishal Chauhan',
  'Kamla Devi',
  'Pawan Kumar',
  'Nisha Sharma',
  'Yogesh Mishra',
  'Rani Kumari',
  'Harish Joshi',
  'Sarita Verma',
]

export const mockCustomers: Customer[] = customerNames.map((name, i) => ({
  id: `cust-${padId(i + 1)}`,
  tenantId: 'tenant-1',
  name,
  phone: `97${padId(i + 10, 8)}`,
  email: i % 3 === 0 ? `${name.split(' ')[0]!.toLowerCase()}${i}@gmail.com` : null,
  address: i % 2 === 0 ? `${50 + i * 3}, Ward ${(i % 20) + 1}, Varanasi` : null,
  outstandingBalance: String((i * 271) % 5000),
  createdAt: '2026-02-01T08:00:00Z',
}))

// ── Bills ────────────────────────────────────────────────

function generateMockBills(count: number = 100): Bill[] {
  const bills: Bill[] = []

  for (let i = 0; i < count; i++) {
    const product1 = mockProducts[(i * 3) % mockProducts.length]!
    const product2 = mockProducts[(i * 3 + 1) % mockProducts.length]!
    const qty1 = (i % 5) + 1
    const qty2 = (i % 3) + 1

    const line1Total = product1.sellingPrice * qty1
    const line2Total = product2.sellingPrice * qty2
    const subtotal = line1Total + line2Total
    const taxAmount = Math.round(subtotal * (product1.gstRate / 100) * 100) / 100
    const netAmount = subtotal + taxAmount

    const paymentMode = deterministicPick(['cash', 'upi', 'card', 'cash', 'upi'] as const, i)

    const items: BillItem[] = [
      {
        id: `bi-${padId(i + 1)}-1`,
        billId: `bill-${padId(i + 1)}`,
        productId: product1.id,
        productName: product1.name,
        sku: product1.sku,
        size: product1.size,
        quantity: qty1,
        unitPrice: String(product1.sellingPrice),
        catalogDiscountPct: 0,
        lineTotal: String(line1Total),
        gstRate: product1.gstRate,
        gstAmount: String(Math.round(((line1Total * product1.gstRate) / 100) * 100) / 100),
      },
      {
        id: `bi-${padId(i + 1)}-2`,
        billId: `bill-${padId(i + 1)}`,
        productId: product2.id,
        productName: product2.name,
        sku: product2.sku,
        size: product2.size,
        quantity: qty2,
        unitPrice: String(product2.sellingPrice),
        catalogDiscountPct: 0,
        lineTotal: String(line2Total),
        gstRate: product2.gstRate,
        gstAmount: String(Math.round(((line2Total * product2.gstRate) / 100) * 100) / 100),
      },
    ]

    const payments: BillPayment[] = [
      {
        id: `bp-${padId(i + 1)}`,
        billId: `bill-${padId(i + 1)}`,
        mode: paymentMode,
        amount: String(netAmount),
        reference: paymentMode === 'upi' ? `UPI${padId(i + 1, 8)}` : null,
      },
    ]

    // Spread bills across March 2026
    const day = (i % 28) + 1
    const hour = (i % 12) + 8
    const dateStr = `2026-03-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${padId((i * 7) % 60, 2)}:00Z`

    bills.push({
      id: `bill-${padId(i + 1)}`,
      tenantId: 'tenant-1',
      billNumber: `SKG-2026-${padId(i + 1, 5)}`,
      customerId: i % 3 === 0 ? deterministicPick(mockCustomers, i).id : null,
      salespersonId: deterministicPick(
        mockUsers.filter((u) => u.role === 'salesperson' || u.role === 'owner'),
        i,
      ).id,
      subtotal: String(subtotal),
      catalogDiscountTotal: '0',
      additionalDiscountAmount: '0',
      taxAmount: String(taxAmount),
      netAmount: String(netAmount),
      gstSchemeAtSale: 'composition',
      status: i % 20 === 0 ? 'voided' : 'completed',
      notes: null,
      createdAt: dateStr,
      items,
      payments,
      customer: i % 3 === 0 ? deterministicPick(mockCustomers, i) : undefined,
    })
  }

  return bills
}

export const mockBills: Bill[] = generateMockBills(100)

// ── Purchases ────────────────────────────────────────────

function generateMockPurchases(count: number = 30): Purchase[] {
  const purchases: Purchase[] = []

  for (let i = 0; i < count; i++) {
    const supplier = deterministicPick(mockSuppliers, i)
    const prod1 = mockProducts[(i * 7) % mockProducts.length]!
    const prod2 = mockProducts[(i * 7 + 3) % mockProducts.length]!
    const qty1 = (((i + 1) * 10) % 50) + 10
    const qty2 = (((i + 2) * 8) % 40) + 5

    const cost1 = prod1.costPrice * qty1
    const cost2 = prod2.costPrice * qty2
    const totalAmount = cost1 + cost2

    const items: PurchaseItem[] = [
      {
        id: `pi-${padId(i + 1)}-1`,
        purchaseId: `pur-${padId(i + 1)}`,
        productId: prod1.id,
        quantity: qty1,
        costPrice: String(prod1.costPrice),
        gstRate: prod1.gstRate,
        gstAmount: String(Math.round((cost1 * prod1.gstRate) / 100)),
      },
      {
        id: `pi-${padId(i + 1)}-2`,
        purchaseId: `pur-${padId(i + 1)}`,
        productId: prod2.id,
        quantity: qty2,
        costPrice: String(prod2.costPrice),
        gstRate: prod2.gstRate,
        gstAmount: String(Math.round((cost2 * prod2.gstRate) / 100)),
      },
    ]

    const day = (i % 28) + 1
    const dateStr = `2026-03-${String(day).padStart(2, '0')}T09:00:00Z`

    purchases.push({
      id: `pur-${padId(i + 1)}`,
      tenantId: 'tenant-1',
      supplierId: supplier.id,
      invoiceNumber: `INV-${supplier.name.substring(0, 3).toUpperCase()}-${padId(i + 1, 5)}`,
      invoiceDate: dateStr,
      invoiceImageUrl: null,
      totalAmount: String(totalAmount),
      cgstAmount: String(Math.round(totalAmount * 0.025)),
      sgstAmount: String(Math.round(totalAmount * 0.025)),
      igstAmount: null,
      isRcm: false,
      createdAt: dateStr,
      items,
      supplier,
    })
  }

  return purchases
}

export const mockPurchases: Purchase[] = generateMockPurchases(30)

// ── Stock Items ──────────────────────────────────────────

export const mockStockItems: StockItem[] = mockProducts.slice(0, 200).map((p) => {
  const stock = p.currentStock ?? 0
  let status: 'healthy' | 'low' | 'out' = 'healthy'
  if (stock === 0) status = 'out'
  else if (stock < p.minStockLevel) status = 'low'

  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    currentStock: stock,
    minStockLevel: p.minStockLevel,
    status,
  }
})

// ── Cash Register ────────────────────────────────────────

export const mockCashRegisterEntries: CashRegisterEntry[] = [
  {
    id: 'cre-1',
    registerId: 'cr-1',
    type: 'sale',
    amount: '2500',
    description: 'Bill #SKG-2026-00001',
    referenceId: 'bill-001',
    createdAt: '2026-03-15T10:30:00Z',
  },
  {
    id: 'cre-2',
    registerId: 'cr-1',
    type: 'sale',
    amount: '1800',
    description: 'Bill #SKG-2026-00002',
    referenceId: 'bill-002',
    createdAt: '2026-03-15T11:15:00Z',
  },
  {
    id: 'cre-3',
    registerId: 'cr-1',
    type: 'expense',
    amount: '-500',
    description: 'Tea & snacks',
    referenceId: null,
    createdAt: '2026-03-15T13:00:00Z',
  },
  {
    id: 'cre-4',
    registerId: 'cr-1',
    type: 'sale',
    amount: '3200',
    description: 'Bill #SKG-2026-00003',
    referenceId: 'bill-003',
    createdAt: '2026-03-15T15:45:00Z',
  },
]

export const mockCashRegister: CashRegister = {
  id: 'cr-1',
  userId: 'user-1',
  openingBalance: '5000',
  calculatedClosing: null,
  actualClosing: null,
  discrepancy: null,
  status: 'open',
  entries: mockCashRegisterEntries,
  currentBalance: '12000',
  openedAt: '2026-03-15T09:00:00Z',
  closedAt: null,
}

export const mockCashRegisterHistory: CashRegister[] = [
  {
    id: 'cr-0',
    userId: 'user-1',
    openingBalance: '5000',
    calculatedClosing: '18500',
    actualClosing: '18400',
    discrepancy: '-100',
    status: 'closed',
    openedAt: '2026-03-14T09:00:00Z',
    closedAt: '2026-03-14T21:00:00Z',
  },
  mockCashRegister,
]

// ── Dashboard ────────────────────────────────────────────

export const mockDashboardData: DashboardData = {
  todaySales: { total: 45250, count: 18, yesterdayTotal: 38900 },
  outstandingReceivables: 12500,
  outstandingPayables: 87000,
  lowStockCount: mockStockItems.filter((s) => s.status === 'low').length,
  recentBills: mockBills.slice(0, 5),
  paymentModeSplit: { cash: 22000, upi: 18000, card: 5250 },
  todayProfit: 13575,
  cashInHand: 12000,
  agingInventoryCount: 15,
  topSellers: [
    {
      productId: 'prod-000001',
      productName: mockProducts[0]!.name,
      quantitySold: 42,
      revenue: 12600,
    },
    {
      productId: 'prod-000010',
      productName: mockProducts[9]!.name,
      quantitySold: 35,
      revenue: 9800,
    },
    {
      productId: 'prod-000025',
      productName: mockProducts[24]!.name,
      quantitySold: 28,
      revenue: 16800,
    },
    {
      productId: 'prod-000050',
      productName: mockProducts[49]!.name,
      quantitySold: 22,
      revenue: 8800,
    },
    {
      productId: 'prod-000100',
      productName: mockProducts[99]!.name,
      quantitySold: 18,
      revenue: 14400,
    },
  ],
  supplierPaymentsDue: [
    {
      supplierId: 'sup-001',
      supplierName: mockSuppliers[0]!.name,
      amount: 25000,
      dueDate: '2026-04-10',
    },
    {
      supplierId: 'sup-003',
      supplierName: mockSuppliers[2]!.name,
      amount: 18000,
      dueDate: '2026-04-15',
    },
    {
      supplierId: 'sup-005',
      supplierName: mockSuppliers[4]!.name,
      amount: 12000,
      dueDate: '2026-04-20',
    },
  ],
}

// ── Ledger Entries ───────────────────────────────────────

export function generateMockLedger(entityId: string, count: number = 15): LedgerEntry[] {
  const entries: LedgerEntry[] = []
  let balance = 0

  for (let i = 0; i < count; i++) {
    const isDebit = i % 3 !== 0
    const amount = deterministicPrice(500, 5000, i + entityId.length)
    if (isDebit) {
      balance += amount
    } else {
      balance -= amount
    }

    const day = (i % 28) + 1
    entries.push({
      id: `le-${entityId}-${padId(i + 1)}`,
      date: `2026-03-${String(day).padStart(2, '0')}`,
      description: isDebit ? `Purchase Invoice #INV-${padId(i + 1, 5)}` : `Payment received`,
      debit: isDebit ? String(amount) : null,
      credit: isDebit ? null : String(amount),
      runningBalance: String(Math.abs(balance)),
      type: isDebit ? 'purchase' : 'payment',
      referenceId: isDebit ? `pur-${padId((i % 30) + 1)}` : null,
    })
  }

  return entries
}

// ── Notifications ────────────────────────────────────────

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'low_stock',
    title: 'Low Stock Alert',
    message: 'Rupa RN Vest - L is running low (3 units remaining)',
    entityType: 'product',
    entityId: 'prod-000001',
    read: false,
    createdAt: '2026-03-15T14:00:00Z',
  },
  {
    id: 'notif-2',
    type: 'payment_due',
    title: 'Supplier Payment Due',
    message: 'Payment of Rs. 25,000 due to Rupa & Co. Ltd by Apr 10',
    entityType: 'supplier',
    entityId: 'sup-001',
    read: false,
    createdAt: '2026-03-15T09:00:00Z',
  },
  {
    id: 'notif-3',
    type: 'daily_summary',
    title: 'Daily Sales Summary',
    message: 'Yesterday: 18 bills totalling Rs. 38,900. Top seller: Rupa RN Vest.',
    read: true,
    createdAt: '2026-03-15T08:00:00Z',
  },
  {
    id: 'notif-4',
    type: 'low_stock',
    title: 'Out of Stock',
    message: 'Dollar Brief Underwear - M is out of stock',
    entityType: 'product',
    entityId: 'prod-000020',
    read: false,
    createdAt: '2026-03-14T16:00:00Z',
  },
  {
    id: 'notif-5',
    type: 'discrepancy',
    title: 'Cash Discrepancy',
    message: 'Cash register closed with Rs. 100 discrepancy yesterday',
    entityType: 'cash_register',
    entityId: 'cr-0',
    read: true,
    createdAt: '2026-03-14T21:05:00Z',
  },
  {
    id: 'notif-6',
    type: 'info',
    title: 'New Feature',
    message: 'Label printing is now available. Go to Products > Print Labels.',
    read: true,
    createdAt: '2026-03-13T10:00:00Z',
  },
]

// ── Label Templates ──────────────────────────────────────

export const mockLabelTemplates = [
  { id: 'tpl-1', name: 'Standard 50x25mm', description: 'Standard barcode label with price' },
  { id: 'tpl-2', name: 'Jewellery Tag', description: 'Small tag for jewellery and accessories' },
  {
    id: 'tpl-3',
    name: 'Shelf Label 70x30mm',
    description: 'Shelf edge label with product details',
  },
]
