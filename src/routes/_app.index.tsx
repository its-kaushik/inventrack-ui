import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { getDashboard } from '@/api/dashboard.api'
import type { DashboardData, SalespersonDashboardData } from '@/types/models'
import { useRole } from '@/hooks/use-role'
import { OwnerDashboard } from '@/features/dashboard/owner-dashboard'
import { SalespersonDashboard } from '@/features/dashboard/salesperson-dashboard'

export const Route = createFileRoute('/_app/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { isSalesperson } = useRole()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {isSalesperson ? <SalespersonView /> : <OwnerManagerView />}
    </div>
  )
}

function OwnerManagerView() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.dashboard(),
    queryFn: () => getDashboard().then((res) => res.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <p className="py-10 text-center text-sm text-destructive">
        Failed to load dashboard data.
      </p>
    )
  }

  return <OwnerDashboard data={data as DashboardData} />
}

function SalespersonView() {
  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.dashboard(), 'my'],
    queryFn: () => getDashboard().then((res) => res.data as SalespersonDashboardData),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <p className="py-10 text-center text-sm text-destructive">
        Failed to load dashboard data.
      </p>
    )
  }

  return <SalespersonDashboard data={data} />
}
