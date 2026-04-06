import { create } from 'zustand';

interface OfflineState {
  isOnline: boolean;
  pendingBillCount: number;
  unresolvedConflictCount: number;
  isSyncing: boolean;
  lastSyncedAt: string | null;

  setOnline: (online: boolean) => void;
  setPendingBillCount: (count: number) => void;
  setUnresolvedConflictCount: (count: number) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSynced: (timestamp: string) => void;
}

export const useOfflineStore = create<OfflineState>()((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingBillCount: 0,
  unresolvedConflictCount: 0,
  isSyncing: false,
  lastSyncedAt: null,

  setOnline: (online) => set({ isOnline: online }),
  setPendingBillCount: (count) => set({ pendingBillCount: count }),
  setUnresolvedConflictCount: (count) => set({ unresolvedConflictCount: count }),
  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setLastSynced: (timestamp) => set({ lastSyncedAt: timestamp }),
}));
