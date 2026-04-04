import { db } from '@/db/offline-db'
import { listProducts } from '@/api/products.api'

type SyncState = 'idle' | 'syncing' | 'ready' | 'error'

let syncState: SyncState = 'idle'
const listeners = new Set<(state: SyncState) => void>()

function setSyncState(state: SyncState) {
  syncState = state
  listeners.forEach((fn) => fn(state))
}

export function onSyncStateChange(fn: (state: SyncState) => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function getSyncState() {
  return syncState
}

// Full sync on first login — paginated fetch -> IndexedDB bulk insert
export async function fullCatalogSync() {
  setSyncState('syncing')
  try {
    let offset = 0
    const limit = 100
    let hasMore = true

    // Clear existing products for full sync
    await db.products.clear()

    while (hasMore) {
      const response = await listProducts({ limit, offset, is_active: true })
      const items = response.data?.items ?? ((response.data as any) ?? [])

      if (items.length > 0) {
        await db.products.bulkPut(
          items.map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            barcode: p.barcode,
            sellingPrice: Number(p.sellingPrice),
            catalogDiscountPct: Number(p.catalogDiscountPct ?? 0),
            gstRate: Number(p.gstRate ?? 5),
            size: p.size ?? null,
            categoryId: p.categoryId,
            brandId: p.brandId ?? null,
            isActive: p.isActive !== false,
            updatedAt: p.updatedAt ?? new Date().toISOString(),
          })),
        )
      }

      hasMore = items.length === limit
      offset += limit
    }

    setSyncState('ready')
  } catch (error) {
    console.error('Catalog sync failed:', error)
    setSyncState('error')
  }
}

// Incremental sync — only products updated since last sync
export async function incrementalCatalogSync() {
  const lastProduct = await db.products.orderBy('updatedAt').last()
  const updatedAfter = lastProduct?.updatedAt

  if (!updatedAfter) {
    return fullCatalogSync()
  }

  setSyncState('syncing')
  try {
    let offset = 0
    const limit = 100
    let hasMore = true

    while (hasMore) {
      const response = await listProducts({
        limit,
        offset,
        updated_after: updatedAfter,
      })
      const items = response.data?.items ?? ((response.data as any) ?? [])

      if (items.length > 0) {
        await db.products.bulkPut(
          items.map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            barcode: p.barcode,
            sellingPrice: Number(p.sellingPrice),
            catalogDiscountPct: Number(p.catalogDiscountPct ?? 0),
            gstRate: Number(p.gstRate ?? 5),
            size: p.size ?? null,
            categoryId: p.categoryId,
            brandId: p.brandId ?? null,
            isActive: p.isActive !== false,
            updatedAt: p.updatedAt ?? new Date().toISOString(),
          })),
        )
      }

      hasMore = items.length === limit
      offset += limit
    }

    setSyncState('ready')
  } catch (error) {
    console.error('Incremental sync failed:', error)
    setSyncState('error')
  }
}

// Start periodic sync (every 5 minutes)
let syncInterval: ReturnType<typeof setInterval> | null = null

export function startCatalogSync() {
  // Do a full sync first
  fullCatalogSync()

  // Then incremental every 5 minutes
  syncInterval = setInterval(incrementalCatalogSync, 5 * 60 * 1000)
}

export function stopCatalogSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}
