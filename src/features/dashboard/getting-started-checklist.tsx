import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Check,
  Tag,
  Package,
  ArchiveRestore,
  Users,
  Truck,
  Barcode,
  Receipt,
  X,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'inventrack:getting-started'

interface ChecklistItem {
  id: string
  label: string
  description: string
  to: string
  icon: React.ElementType
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'setup-categories',
    label: 'Set up categories',
    description: 'Create product categories to organize your inventory.',
    to: '/settings/categories',
    icon: Tag,
  },
  {
    id: 'add-first-product',
    label: 'Add your first product',
    description: 'Create a product with pricing and stock details.',
    to: '/inventory/products/new',
    icon: Package,
  },
  {
    id: 'record-opening-stock',
    label: 'Record opening stock',
    description: 'Enter current stock levels for your products.',
    to: '/inventory/stock',
    icon: ArchiveRestore,
  },
  {
    id: 'set-customer-balances',
    label: 'Set customer balances',
    description: 'Add customers and their outstanding balances.',
    to: '/customers',
    icon: Users,
  },
  {
    id: 'set-supplier-balances',
    label: 'Set supplier balances',
    description: 'Add suppliers and their outstanding balances.',
    to: '/suppliers',
    icon: Truck,
  },
  {
    id: 'print-first-barcode',
    label: 'Print first barcode',
    description: 'Generate and print barcode labels for your products.',
    to: '/inventory/labels',
    icon: Barcode,
  },
  {
    id: 'create-test-bill',
    label: 'Create a test bill',
    description: 'Try billing a product to see how POS works.',
    to: '/pos',
    icon: Receipt,
  },
]

function loadState(): { completed: string[]; dismissed: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        completed: Array.isArray(parsed.completed) ? parsed.completed : [],
        dismissed: !!parsed.dismissed,
      }
    }
  } catch {
    // ignore
  }
  return { completed: [], dismissed: false }
}

function saveState(state: { completed: string[]; dismissed: boolean }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function GettingStartedChecklist() {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  if (state.dismissed) {
    return null
  }

  const completedCount = state.completed.length
  const totalCount = CHECKLIST_ITEMS.length
  const progressPct = Math.round((completedCount / totalCount) * 100)

  function toggleItem(id: string) {
    setState((prev) => {
      const isCompleted = prev.completed.includes(id)
      return {
        ...prev,
        completed: isCompleted
          ? prev.completed.filter((c) => c !== id)
          : [...prev.completed, id],
      }
    })
  }

  function dismiss() {
    setState((prev) => ({ ...prev, dismissed: true }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              {completedCount}/{totalCount} completed
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={dismiss}
            aria-label="Dismiss checklist"
          >
            <X className="size-4" />
          </Button>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {CHECKLIST_ITEMS.map((item) => {
          const isCompleted = state.completed.includes(item.id)
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  isCompleted
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/30 hover:border-primary/50',
                )}
                aria-label={isCompleted ? `Mark "${item.label}" as incomplete` : `Mark "${item.label}" as complete`}
              >
                {isCompleted && <Check className="size-3" />}
              </button>
              <div className="flex-1 min-w-0">
                <Link
                  to={item.to}
                  className={cn(
                    'text-sm font-medium hover:underline',
                    isCompleted && 'text-muted-foreground line-through',
                  )}
                >
                  {item.label}
                </Link>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <item.icon
                className={cn(
                  'mt-0.5 size-4 shrink-0',
                  isCompleted ? 'text-muted-foreground/40' : 'text-muted-foreground',
                )}
              />
            </div>
          )
        })}

        <div className="pt-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={dismiss}
          >
            I'm all set &mdash; dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
