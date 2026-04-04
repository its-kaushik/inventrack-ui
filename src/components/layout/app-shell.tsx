import { useIsDesktop } from '@/hooks/use-media-query'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { TopBar } from './top-bar'
import { useRouter } from '@tanstack/react-router'

export function AppShell({ children }: { children: React.ReactNode }) {
  const isDesktop = useIsDesktop()
  const router = useRouter()
  const pathname = router.state.location.pathname

  // POS and setup get full-screen treatment
  const isFullScreen =
    pathname.startsWith('/pos') || pathname.startsWith('/setup')

  if (isFullScreen) {
    return <>{children}</>
  }

  if (isDesktop) {
    return (
      <div className="flex h-dvh">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col">
      <TopBar title="InvenTrack" />
      <main className="flex-1 overflow-auto p-4 pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}
