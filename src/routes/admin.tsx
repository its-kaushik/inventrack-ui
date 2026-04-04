import { createFileRoute, Outlet, redirect, Link, useRouter } from '@tanstack/react-router'
import { LayoutDashboard, Building2, LogOut, Shield } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
    // Only super_admin can access admin routes
    if (context.auth.user?.role !== 'super_admin') {
      throw redirect({ to: '/' })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const logout = useAuthStore((s) => s.logout)
  const router = useRouter()
  const pathname = router.state.location.pathname

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' as const },
    { label: 'Tenants', icon: Building2, to: '/admin/tenants' as const },
  ]

  return (
    <div className="flex h-dvh">
      {/* Admin Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-slate-900 text-white lg:flex">
        <div className="flex items-center gap-2 px-4 py-5 border-b border-slate-700">
          <Shield className="size-6 text-amber-400" />
          <div>
            <h1 className="font-bold text-lg">InvenTrack</h1>
            <p className="text-xs text-slate-400">Super Admin</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                pathname === item.to
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700">
          <button
            onClick={() => {
              logout()
              window.location.href = '/login'
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="size-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-background p-6">
        <Outlet />
      </main>
    </div>
  )
}
