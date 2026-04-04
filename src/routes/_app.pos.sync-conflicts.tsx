import { useState, useEffect, useCallback } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, RefreshCw, Trash2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import {
  getPendingBills,
  syncOfflineBills,
  discardOfflineBill,
} from '@/lib/offline-bills'
import type { OfflineBill } from '@/db/offline-db'
import { formatDateTime } from '@/lib/format-date'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/feedback/confirm-dialog'

export const Route = createFileRoute('/_app/pos/sync-conflicts')({
  component: SyncConflictsPage,
})

function SyncConflictsPage() {
  const user = useAuthStore((s) => s.user)
  const canAccess = user?.role === 'owner' || user?.role === 'manager'

  const [bills, setBills] = useState<OfflineBill[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [discardTarget, setDiscardTarget] = useState<string | null>(null)

  const loadBills = useCallback(async () => {
    setLoading(true)
    try {
      const pending = await getPendingBills()
      setBills(pending)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBills()
  }, [loadBills])

  const handleRetryAll = async () => {
    setSyncing(true)
    try {
      const result = await syncOfflineBills()
      if (result.synced > 0) {
        toast.success(`${result.synced} bill${result.synced > 1 ? 's' : ''} synced`)
      }
      await loadBills()
    } finally {
      setSyncing(false)
    }
  }

  const handleDiscard = async () => {
    if (!discardTarget) return
    await discardOfflineBill(discardTarget)
    setDiscardTarget(null)
    toast.success('Offline bill discarded')
    await loadBills()
  }

  if (!canAccess) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
        <p className="text-muted-foreground">Only owners and managers can access this page.</p>
        <Link to="/pos">
          <Button variant="outline">Back to POS</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/pos">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold lg:text-2xl">Sync Conflicts</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadBills}
            disabled={loading}
          >
            <RefreshCw className={`mr-1 size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {bills.length > 0 && (
            <Button
              size="sm"
              onClick={handleRetryAll}
              disabled={syncing}
            >
              <RotateCcw className={`mr-1 size-3.5 ${syncing ? 'animate-spin' : ''}`} />
              Retry All
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : bills.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-medium">No pending bills</p>
            <p className="text-sm text-muted-foreground">
              All offline bills have been synced successfully.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => {
            const payload = bill.payload as {
              items?: Array<{ productId: string; quantity: number }>
              payments?: Array<{ amount: number }>
            }
            const itemCount = payload.items?.length ?? 0
            const total = payload.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0

            return (
              <Card key={bill.clientId}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-mono">
                      {bill.clientId.slice(0, 8)}...
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(bill.createdAt)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                      <span className="font-medium text-foreground">
                        {'\u20B9'}{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="xs"
                        onClick={() => setDiscardTarget(bill.clientId)}
                      >
                        <Trash2 className="mr-1 size-3" />
                        Discard
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Discard confirm dialog */}
      <ConfirmDialog
        open={discardTarget !== null}
        onOpenChange={(open) => { if (!open) setDiscardTarget(null) }}
        title="Discard offline bill?"
        description="This bill will be permanently deleted and cannot be recovered."
        confirmLabel="Discard"
        destructive
        onConfirm={handleDiscard}
      />
    </div>
  )
}
