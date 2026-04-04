import { create } from 'zustand'

interface UiState {
  sidebarCollapsed: boolean
  scanMode: 'type' | 'scan'
  offlineBannerDismissed: boolean
  currentRegisterId: string | null

  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setScanMode: (mode: 'type' | 'scan') => void
  dismissOfflineBanner: () => void
  setCurrentRegisterId: (id: string | null) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  scanMode: (localStorage.getItem('scanMode') as 'type' | 'scan') ?? 'type',
  offlineBannerDismissed: false,
  currentRegisterId: null,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setScanMode: (mode) => {
    localStorage.setItem('scanMode', mode)
    set({ scanMode: mode })
  },
  dismissOfflineBanner: () => set({ offlineBannerDismissed: true }),
  setCurrentRegisterId: (id) => set({ currentRegisterId: id }),
}))
