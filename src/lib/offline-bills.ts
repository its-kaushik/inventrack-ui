import { db } from '@/db/offline-db'
import { toast } from 'sonner'

export async function queueOfflineBill(billData: {
  items: Array<{ productId: string; quantity: number }>
  payments: Array<{ mode: string; amount: number; reference?: string }>
  customerId?: string | null
  additionalDiscountAmount?: number
  additionalDiscountPct?: number
  notes?: string | null
}) {
  const clientId = crypto.randomUUID()
  await db.offlineBills.add({
    clientId,
    payload: billData,
    createdAt: new Date().toISOString(),
    synced: false,
  })
  return clientId
}

export async function syncOfflineBills() {
  const pending = await db.offlineBills.where('synced').equals(0).toArray()
  if (pending.length === 0) return { synced: 0, conflicts: 0 }

  let syncedCount = 0
  let conflictCount = 0

  // Try syncing each bill individually (fallback if batch endpoint not available)
  for (const bill of pending) {
    try {
      const { createBill } = await import('@/api/bills.api')
      await createBill({
        ...(bill.payload as Parameters<typeof createBill>[0]),
        clientId: bill.clientId,
      })
      await db.offlineBills.where('clientId').equals(bill.clientId).modify({ synced: true })
      syncedCount++
    } catch (err) {
      console.error(`Failed to sync bill ${bill.clientId}:`, err)
      conflictCount++
    }
  }

  // Clean up synced bills
  await db.offlineBills.where('synced').equals(1).delete()

  if (syncedCount > 0 && conflictCount === 0) {
    toast.success(`${syncedCount} offline bill${syncedCount > 1 ? 's' : ''} synced`)
  } else if (syncedCount > 0 && conflictCount > 0) {
    toast.warning(`${syncedCount} synced, ${conflictCount} need review`)
  } else if (conflictCount > 0) {
    toast.error(`${conflictCount} bill${conflictCount > 1 ? 's' : ''} failed to sync`)
  }

  return { synced: syncedCount, conflicts: conflictCount }
}

export async function getPendingBillCount(): Promise<number> {
  return db.offlineBills.where('synced').equals(0).count()
}

export async function discardOfflineBill(clientId: string) {
  await db.offlineBills.where('clientId').equals(clientId).delete()
}

export async function getPendingBills() {
  return db.offlineBills.where('synced').equals(0).toArray()
}
