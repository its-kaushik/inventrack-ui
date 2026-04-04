import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function getSnapshot() {
  return navigator.onLine
}

export function useOnline() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true)
}

// Call this once from app root
export function setupReconnectSync() {
  window.addEventListener('online', async () => {
    const { syncOfflineBills } = await import('@/lib/offline-bills')
    syncOfflineBills()
  })
}
