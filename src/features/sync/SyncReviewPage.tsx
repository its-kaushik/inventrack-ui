import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Package,
  Users,
  IndianRupee,
  Hash,
  Clock,
} from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { StatusBadge, EmptyState, ConfirmSheet } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useSyncConflicts, useResolveConflict } from '@/hooks/use-sync';
import { formatDateTime } from '@/lib/format-date';
import { cn } from '@/lib/cn';
import type { SyncConflict } from '@/api/sync.api';

const CONFLICT_TYPE_INFO: Record<string, { icon: typeof Package; label: string; color: string }> = {
  negative_stock: { icon: Package, label: 'Negative Stock', color: 'text-error-600' },
  duplicate_customer: { icon: Users, label: 'Duplicate Customer', color: 'text-warning-600' },
  stale_price: { icon: IndianRupee, label: 'Stale Price', color: 'text-amber-600' },
  bill_number_collision: { icon: Hash, label: 'Bill Number', color: 'text-info-500' },
};

const RESOLUTION_OPTIONS: { value: string; label: string }[] = [
  { value: 'acknowledge', label: 'Acknowledge' },
  { value: 'create_adjustment', label: 'Create Stock Adjustment' },
  { value: 'void_rebill', label: 'Void & Re-bill' },
  { value: 'merge', label: 'Merge Records' },
  { value: 'keep_server', label: 'Keep Server Version' },
];

export default function SyncReviewPage() {
  const navigate = useNavigate();
  const { data: conflicts, isLoading } = useSyncConflicts();
  const resolveConflict = useResolveConflict();

  const [tab, setTab] = useState<'unresolved' | 'resolved'>('unresolved');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [selectedResolution, setSelectedResolution] = useState('acknowledge');

  const unresolved = conflicts?.filter((c) => c.status === 'unresolved') ?? [];
  const resolved = conflicts?.filter((c) => c.status === 'resolved') ?? [];
  const activeList = tab === 'unresolved' ? unresolved : resolved;

  const handleResolve = () => {
    if (!resolvingId) return;
    resolveConflict.mutate(
      { id: resolvingId, resolution: selectedResolution as any },
      { onSuccess: () => setResolvingId(null) },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 desktop:p-6">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 desktop:p-6">
      <PageHeader title="Sync Review" showBack onBack={() => navigate('/dashboard')} />

      {/* Summary */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-btn bg-error-50 px-3 py-1.5">
          <AlertTriangle className="size-4 text-error-600" />
          <span className="text-sm font-medium text-error-700">{unresolved.length} unresolved</span>
        </div>
        <div className="flex items-center gap-2 rounded-btn bg-success-50 px-3 py-1.5">
          <CheckCircle className="size-4 text-success-600" />
          <span className="text-sm font-medium text-success-700">{resolved.length} resolved</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(val) => setTab((val as 'unresolved' | 'resolved') ?? 'unresolved')}>
        <TabsList className="w-full">
          <TabsTrigger value="unresolved" className="flex-1">
            Unresolved ({unresolved.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex-1">
            Resolved ({resolved.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Conflict list */}
      {activeList.length === 0 ? (
        <EmptyState
          icon={tab === 'unresolved' ? CheckCircle : RefreshCw}
          title={tab === 'unresolved' ? 'All clear!' : 'No resolved conflicts'}
          description={
            tab === 'unresolved'
              ? 'No sync conflicts need your attention.'
              : 'Resolved conflicts will appear here.'
          }
        />
      ) : (
        <div className="space-y-3">
          {activeList.map((conflict) => (
            <ConflictCard
              key={conflict.id}
              conflict={conflict}
              onResolve={() => {
                setResolvingId(conflict.id);
                setSelectedResolution('acknowledge');
              }}
            />
          ))}
        </div>
      )}

      {/* Resolution select (shown above confirm sheet) */}
      {resolvingId && (
        <div className="fixed inset-x-0 bottom-48 z-50 mx-auto max-w-sm px-4">
          <Select value={selectedResolution} onValueChange={(val) => setSelectedResolution(val ?? 'acknowledge')}>
            <SelectTrigger className="w-full bg-white shadow-modal">
              <SelectValue placeholder="Resolution action..." />
            </SelectTrigger>
            <SelectContent>
              {RESOLUTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Resolution confirmation */}
      <ConfirmSheet
        open={!!resolvingId}
        onOpenChange={(open) => { if (!open) setResolvingId(null); }}
        title="Resolve Conflict"
        description={`Action: ${RESOLUTION_OPTIONS.find((o) => o.value === selectedResolution)?.label ?? selectedResolution}`}
        confirmLabel={resolveConflict.isPending ? 'Resolving...' : 'Resolve'}
        onConfirm={handleResolve}
      />
    </div>
  );
}

// ── Conflict Card ──

function ConflictCard({
  conflict,
  onResolve,
}: {
  conflict: SyncConflict;
  onResolve: () => void;
}) {
  const info = CONFLICT_TYPE_INFO[conflict.conflictType] ?? {
    icon: AlertTriangle,
    label: conflict.conflictType,
    color: 'text-neutral-600',
  };
  const Icon = info.icon;
  const isResolved = conflict.status === 'resolved';

  return (
    <Card className={cn(isResolved && 'opacity-70')}>
      <CardContent className="py-3">
        <div className="flex items-start gap-3">
          <div className={cn('mt-0.5 shrink-0', info.color)}>
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-800">{info.label}</span>
              <StatusBadge
                status={isResolved ? 'green' : 'red'}
                label={isResolved ? 'Resolved' : 'Unresolved'}
              />
            </div>
            <p className="mt-0.5 text-sm text-neutral-600">{conflict.description}</p>
            {conflict.billNumber && (
              <p className="mt-1 text-xs text-neutral-400">Bill: {conflict.billNumber}</p>
            )}
            <p className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
              <Clock className="size-3" />
              {formatDateTime(conflict.createdAt)}
            </p>
            {isResolved && conflict.resolution && (
              <p className="mt-1 text-xs text-success-600">
                Resolution: {conflict.resolution.replace('_', ' ')}
              </p>
            )}
          </div>
          {!isResolved && (
            <Button size="sm" variant="outline" onClick={onResolve} className="shrink-0">
              Resolve
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
