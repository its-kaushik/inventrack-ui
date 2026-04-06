import { useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { syncApi, type ResolveConflictRequest } from '@/api/sync.api';
import { useOfflineStore } from '@/stores/offline.store';
import { useOnlineStatus } from '@/hooks/use-online-status';
import {
  upsertCatalogItems,
  upsertCustomers,
  setSetting,
  getSetting,
  getAllPendingBills,
  deletePendingBill,
  getPendingBillCount,
} from '@/workers/offline-db';
import { CONSTANTS } from '@/config/constants';
import { toast } from 'sonner';

/**
 * Catalog sync: fetches catalog periodically when online, stores in IndexedDB.
 * Should be mounted once at app root level.
 */
export function useCatalogSync() {
  const isOnline = useOnlineStatus();
  const { setLastSynced } = useOfflineStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const syncCatalog = useCallback(async () => {
    try {
      const lastSync = await getSetting<{ value: string }>('lastCatalogSync');
      const since = lastSync?.value;
      const res = await syncApi.getCatalog(since);
      const { variants, customers, settings, syncTimestamp } = res.data;

      if (variants.length > 0) await upsertCatalogItems(variants);
      if (customers.length > 0) await upsertCustomers(customers);
      if (settings) await setSetting('tenantSettings', settings);
      await setSetting('lastCatalogSync', { value: syncTimestamp });

      setLastSynced(syncTimestamp);
    } catch {
      // Silently fail — will retry on next interval
    }
  }, [setLastSynced]);

  useEffect(() => {
    if (!isOnline) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Sync immediately on mount / when coming back online
    syncCatalog();

    // Then sync every 5 minutes
    intervalRef.current = setInterval(syncCatalog, CONSTANTS.OFFLINE.CATALOG_REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOnline, syncCatalog]);
}

/**
 * Bill sync: uploads pending offline bills when back online.
 */
export function useBillSync() {
  const isOnline = useOnlineStatus();
  const { setSyncing, setPendingBillCount, setUnresolvedConflictCount } = useOfflineStore();

  const syncBills = useCallback(async () => {
    const pending = await getAllPendingBills();
    if (pending.length === 0) {
      setPendingBillCount(0);
      return;
    }

    setSyncing(true);
    try {
      const res = await syncApi.uploadBills(pending);
      const { results, syncedCount, conflictCount } = res.data;

      // Remove synced bills from IndexedDB
      for (const result of results) {
        if (result.status === 'synced' || result.status === 'skipped') {
          await deletePendingBill(result.clientId);
        }
      }

      const remaining = await getPendingBillCount();
      setPendingBillCount(remaining);
      setUnresolvedConflictCount(conflictCount);

      if (syncedCount > 0) {
        toast.success(`${syncedCount} bill${syncedCount > 1 ? 's' : ''} synced`);
      }
      if (conflictCount > 0) {
        toast.error(`${conflictCount} sync conflict${conflictCount > 1 ? 's' : ''} need review`);
      }
    } catch {
      toast.error('Failed to sync bills. Will retry.');
    } finally {
      setSyncing(false);
    }
  }, [setSyncing, setPendingBillCount, setUnresolvedConflictCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      syncBills();
    }
  }, [isOnline, syncBills]);

  return { syncBills };
}

/**
 * Sync conflicts query.
 */
export function useSyncConflicts() {
  return useQuery({
    queryKey: ['sync', 'conflicts'],
    queryFn: () => syncApi.getConflicts().then((r) => r.data),
  });
}

/**
 * Resolve a sync conflict.
 */
export function useResolveConflict() {
  const qc = useQueryClient();
  const { setUnresolvedConflictCount } = useOfflineStore();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & ResolveConflictRequest) =>
      syncApi.resolveConflict(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sync', 'conflicts'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      // Decrement local count
      const current = useOfflineStore.getState().unresolvedConflictCount;
      setUnresolvedConflictCount(Math.max(0, current - 1));
      toast.success('Conflict resolved');
    },
    onError: () => toast.error('Failed to resolve conflict'),
  });
}
