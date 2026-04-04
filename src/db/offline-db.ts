import Dexie, { type EntityTable } from 'dexie'

interface OfflineProduct {
  id: string
  name: string
  sku: string
  barcode: string
  sellingPrice: number
  catalogDiscountPct: number
  gstRate: number
  size: string | null
  categoryId: string
  brandId: string | null
  isActive: boolean
  updatedAt: string
}

interface OfflineBill {
  id?: number
  clientId: string
  payload: unknown
  createdAt: string
  synced: boolean
}

class InvenTrackDB extends Dexie {
  products!: EntityTable<OfflineProduct, 'id'>
  offlineBills!: EntityTable<OfflineBill, 'id'>

  constructor() {
    super('inventrack')
    this.version(1).stores({
      products: 'id, sku, barcode, name, categoryId, isActive, updatedAt',
      offlineBills: '++id, clientId, synced',
    })
  }
}

export const db = new InvenTrackDB()

export type { OfflineProduct, OfflineBill }
