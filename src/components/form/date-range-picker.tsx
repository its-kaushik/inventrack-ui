import { useState } from 'react'
import { format, startOfDay, endOfDay, subDays, startOfWeek, startOfMonth, startOfQuarter } from 'date-fns'
import { Calendar, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DateRange {
  from: Date | null
  to: Date | null
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

const presets = [
  { label: 'Today', getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: 'Yesterday', getValue: () => ({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) }) },
  { label: 'This Week', getValue: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfDay(new Date()) }) },
  { label: 'This Month', getValue: () => ({ from: startOfMonth(new Date()), to: endOfDay(new Date()) }) },
  { label: 'This Quarter', getValue: () => ({ from: startOfQuarter(new Date()), to: endOfDay(new Date()) }) },
  { label: 'Last 30 Days', getValue: () => ({ from: startOfDay(subDays(new Date(), 30)), to: endOfDay(new Date()) }) },
  { label: 'Last 90 Days', getValue: () => ({ from: startOfDay(subDays(new Date(), 90)), to: endOfDay(new Date()) }) },
]

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const displayText = value.from && value.to
    ? `${format(value.from, 'dd MMM yyyy')} - ${format(value.to, 'dd MMM yyyy')}`
    : 'Select date range'

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        className="justify-between gap-2 font-normal"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Calendar className="size-4 text-muted-foreground" />
        <span className="truncate">{displayText}</span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-64 rounded-lg border bg-popover p-3 shadow-md">
          <div className="space-y-1">
            {presets.map((preset) => (
              <button
                key={preset.label}
                className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  onChange(preset.getValue())
                  setIsOpen(false)
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="mt-3 border-t pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Custom Range</p>
            <div className="flex gap-2">
              <input
                type="date"
                className="flex-1 rounded-md border px-2 py-1 text-sm"
                value={value.from ? format(value.from, 'yyyy-MM-dd') : ''}
                onChange={(e) => onChange({ ...value, from: e.target.value ? new Date(e.target.value) : null })}
              />
              <input
                type="date"
                className="flex-1 rounded-md border px-2 py-1 text-sm"
                value={value.to ? format(value.to, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  onChange({ ...value, to: e.target.value ? new Date(e.target.value) : null })
                  setIsOpen(false)
                }}
              />
            </div>
          </div>
          <button
            className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              onChange({ from: null, to: null })
              setIsOpen(false)
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}

export type { DateRange, DateRangePickerProps }
