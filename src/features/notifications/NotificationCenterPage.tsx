import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Package,
  AlertTriangle,
  IndianRupee,
  ShoppingCart,
  Truck,
  Clock,
  Info,
} from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/use-notifications';
import { formatDateTime } from '@/lib/format-date';
import { cn } from '@/lib/cn';
import type { Notification } from '@/types/models';

// ── Notification type → icon + color mapping ──

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string }> = {
  low_stock: { icon: Package, color: 'text-warning-500' },
  aging_stock: { icon: Clock, color: 'text-warning-500' },
  negative_stock: { icon: AlertTriangle, color: 'text-error-500' },
  credit_overdue: { icon: IndianRupee, color: 'text-error-500' },
  supplier_due: { icon: Truck, color: 'text-warning-500' },
  sale_completed: { icon: ShoppingCart, color: 'text-success-500' },
  stock_added: { icon: Package, color: 'text-info-500' },
  large_discount: { icon: AlertTriangle, color: 'text-error-500' },
};

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-error-500',
  medium: 'bg-warning-500',
  low: 'bg-info-500',
};

function getNavigationPath(notification: Notification): string | null {
  const { type, data } = notification;
  const entityId = data?.entityId as string | undefined;

  switch (type) {
    case 'low_stock':
    case 'aging_stock':
    case 'negative_stock':
      return entityId ? `/products/${entityId}` : '/products';
    case 'credit_overdue':
      return entityId ? `/credit/customers/${entityId}` : '/credit';
    case 'supplier_due':
      return entityId ? `/credit/suppliers/${entityId}` : '/credit/suppliers';
    case 'sale_completed':
      return entityId ? `/pos/receipt/${entityId}` : '/pos/bills';
    case 'stock_added':
      return entityId ? `/products/${entityId}` : '/products';
    default:
      return null;
  }
}

export default function NotificationCenterPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useNotifications({ page, limit: 20 });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = data?.data ?? [];
  const meta = data?.meta;
  const hasUnread = notifications.some((n) => !n.isRead);

  const handleTap = useCallback(
    (notification: Notification) => {
      if (!notification.isRead) {
        markAsRead.mutate(notification.id);
      }
      const path = getNavigationPath(notification);
      if (path) navigate(path);
    },
    [markAsRead, navigate],
  );

  return (
    <div className="space-y-4 p-4 desktop:p-6">
      <PageHeader
        title="Notifications"
        action={
          hasUnread
            ? {
                label: 'Mark all read',
                onClick: () => markAllAsRead.mutate(),
                icon: CheckCheck,
              }
            : undefined
        }
      />

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-card" />
          ))}
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up! Notifications will appear here when something needs your attention."
        />
      )}

      {!isLoading && notifications.length > 0 && (
        <>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onTap={handleTap}
              />
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-neutral-500">Page {page} of {meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Notification Card ──

function NotificationCard({
  notification,
  onTap,
}: {
  notification: Notification;
  onTap: (n: Notification) => void;
}) {
  const config = TYPE_CONFIG[notification.type] ?? { icon: Info, color: 'text-neutral-500' };
  const Icon = config.icon;
  const priorityDot = PRIORITY_DOT[notification.priority] ?? 'bg-neutral-300';
  const navPath = getNavigationPath(notification);

  return (
    <Card
      className={cn(
        'transition-shadow',
        navPath && 'cursor-pointer hover:shadow-md',
        !notification.isRead && 'border-l-4 border-l-primary-500 bg-primary-50/30',
      )}
      onClick={() => onTap(notification)}
    >
      <CardContent className="flex items-start gap-3 py-3">
        {/* Priority dot */}
        <div className="mt-1.5 shrink-0">
          <div className={cn('size-2 rounded-full', priorityDot)} />
        </div>

        {/* Icon */}
        <div className={cn('mt-0.5 shrink-0', config.color)}>
          <Icon className="size-5" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm text-neutral-800', !notification.isRead && 'font-semibold')}>
            {notification.title}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500 line-clamp-2">
            {notification.message}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {formatDateTime(notification.createdAt)}
          </p>
        </div>

        {/* Unread indicator */}
        {!notification.isRead && (
          <div className="mt-1.5 shrink-0">
            <div className="size-2.5 rounded-full bg-primary-500" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
