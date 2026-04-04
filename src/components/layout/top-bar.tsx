import { useRouter, Link } from '@tanstack/react-router'
import { ArrowLeft, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationStore } from '@/stores/notification.store'
import { Button } from '@/components/ui/button'

interface TopBarProps {
  title: string
  showBack?: boolean
  className?: string
}

export function TopBar({ title, showBack, className }: TopBarProps) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  const initials = user
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?'

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {showBack && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.history.back()}
          >
            <ArrowLeft className="size-4" />
          </Button>
        )}
        <h1 className="text-base font-semibold">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <Link to="/notifications" className="relative">
          <Bell className="size-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initials}
        </div>
      </div>
    </header>
  )
}
