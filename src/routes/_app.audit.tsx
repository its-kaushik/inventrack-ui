import { useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Shield } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { listAuditLogs } from '@/api/audit.api'
import type { AuditLogFilters } from '@/api/audit.api'
import { listUsers } from '@/api/users.api'
import type { AuditLogEntry } from '@/types/models'
import type { AuditAction, EntityType } from '@/types/enums'
import { formatDateTime } from '@/lib/format-date'
import { StatusBadge } from '@/components/data/status-badge'
import { Skeleton } from '@/components/data/loading-skeleton'
import { EmptyState } from '@/components/data/empty-state'
import { DateRangePicker } from '@/components/form/date-range-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table'

const PAGE_SIZE = 20

export const Route = createFileRoute('/_app/audit')({
  beforeLoad: ({ context }) => {
    if (context.auth.user?.role !== 'owner') {
      throw redirect({ to: '/' })
    }
  },
  component: AuditLogPage,
})

const ACTION_OPTIONS: { value: AuditAction; label: string }[] = [
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'void', label: 'Void' },
]

const ENTITY_OPTIONS: { value: EntityType; label: string }[] = [
  { value: 'bill', label: 'Bill' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'product', label: 'Product' },
  { value: 'customer', label: 'Customer' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'user', label: 'User' },
  { value: 'settings', label: 'Settings' },
  { value: 'expense', label: 'Expense' },
  { value: 'purchase_order', label: 'Purchase Order' },
]

function actionVariant(action: AuditAction): 'success' | 'info' | 'error' | 'warning' {
  switch (action) {
    case 'create':
      return 'success'
    case 'update':
      return 'info'
    case 'delete':
      return 'error'
    case 'void':
      return 'warning'
    default:
      return 'info'
  }
}

function AuditLogPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [actionFilter, setActionFilter] = useState<string | null>(null)
  const [entityFilter, setEntityFilter] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  })
  const [offset, setOffset] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: users } = useQuery({
    queryKey: queryKeys.users.all(),
    queryFn: () => listUsers().then((res) => res.data),
  })

  const filters: AuditLogFilters = {
    limit: PAGE_SIZE,
    offset,
    ...(userId && { user_id: userId }),
    ...(actionFilter && { action: actionFilter }),
    ...(entityFilter && { entity_type: entityFilter }),
    ...(dateRange.from && { date_from: dateRange.from.toISOString() }),
    ...(dateRange.to && { date_to: dateRange.to.toISOString() }),
  }

  const { data: logsData, isLoading } = useQuery({
    queryKey: queryKeys.audit.list(filters as Record<string, unknown>),
    queryFn: () => listAuditLogs(filters).then((res) => res.data),
  })

  const items = logsData?.items ?? []
  const hasMore = logsData?.hasMore ?? false

  const handleUserChange = (v: string | null) => {
    setUserId(!v || v === '__all__' ? null : v)
    setOffset(0)
  }

  const handleActionChange = (v: string | null) => {
    setActionFilter(!v || v === '__all__' ? null : v)
    setOffset(0)
  }

  const handleEntityChange = (v: string | null) => {
    setEntityFilter(!v || v === '__all__' ? null : v)
    setOffset(0)
  }

  const toggleRow = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="flex-1 space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review all actions performed in the system.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <DateRangePicker value={dateRange} onChange={(r) => { setDateRange(r); setOffset(0) }} />

        <Select value={userId ?? '__all__'} onValueChange={handleUserChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Users</SelectItem>
            {users?.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={actionFilter ?? '__all__'} onValueChange={handleActionChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Actions</SelectItem>
            {ACTION_OPTIONS.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={entityFilter ?? '__all__'} onValueChange={handleEntityChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Entities</SelectItem>
            {ENTITY_OPTIONS.map((e) => (
              <SelectItem key={e.value} value={e.value}>
                {e.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No audit logs"
          description="No activity found for the selected filters."
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50">
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="hidden sm:table-cell">Entity Type</TableHead>
                <TableHead className="hidden md:table-cell">Entity ID</TableHead>
                <TableHead>Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((entry: AuditLogEntry) => (
                <AuditRow
                  key={entry.id}
                  entry={entry}
                  isExpanded={expandedId === entry.id}
                  onToggle={() => toggleRow(entry.id)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {items.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}&ndash;{offset + items.length} entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              <ChevronLeft className="mr-1 size-3.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              Next
              <ChevronRight className="ml-1 size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Expandable Row ───────────────────────────────────────

function AuditRow({
  entry,
  isExpanded,
  onToggle,
}: {
  entry: AuditLogEntry
  isExpanded: boolean
  onToggle: () => void
}) {
  const hasValues = entry.oldValue != null || entry.newValue != null

  return (
    <>
      <TableRow
        className={hasValues ? 'cursor-pointer' : undefined}
        onClick={hasValues ? onToggle : undefined}
      >
        <TableCell className="w-8">
          {hasValues && (
            isExpanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )
          )}
        </TableCell>
        <TableCell className="whitespace-nowrap text-sm">
          {formatDateTime(entry.createdAt)}
        </TableCell>
        <TableCell className="text-sm">{entry.userName}</TableCell>
        <TableCell>
          <StatusBadge variant={actionVariant(entry.action)}>
            {entry.action}
          </StatusBadge>
        </TableCell>
        <TableCell className="hidden text-sm capitalize sm:table-cell">
          {entry.entityType.replace(/_/g, ' ')}
        </TableCell>
        <TableCell className="hidden font-mono text-xs md:table-cell">
          {entry.entityId.slice(0, 8)}...
        </TableCell>
        <TableCell className="max-w-[200px] truncate text-sm">
          {entry.summary}
        </TableCell>
      </TableRow>

      {isExpanded && hasValues && (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/30 p-0">
            <Card className="m-2 border-dashed">
              <CardContent className="pt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {entry.oldValue != null && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">Old Value</p>
                      <pre className="max-h-60 overflow-auto rounded bg-muted p-3 text-xs">
                        {JSON.stringify(entry.oldValue, null, 2)}
                      </pre>
                    </div>
                  )}
                  {entry.newValue != null && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">New Value</p>
                      <pre className="max-h-60 overflow-auto rounded bg-muted p-3 text-xs">
                        {JSON.stringify(entry.newValue, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
