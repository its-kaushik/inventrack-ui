import { useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
}

interface MultiSelectFilterProps {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelectFilter({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className,
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const selectedLabels = options.filter((o) => value.includes(o.value)).map((o) => o.label)

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        className="justify-between gap-2 font-normal"
        onClick={() => setIsOpen(!isOpen)}
      >
        {value.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          <span className="truncate">{selectedLabels.join(', ')}</span>
        )}
        <ChevronDown className="size-4 text-muted-foreground" />
      </Button>

      {/* Selected pills */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selectedLabels.map((label, i) => (
            <Badge key={value[i]} variant="secondary" className="gap-1">
              {label}
              <button onClick={() => toggle(value[i])}>
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-48 rounded-lg border bg-popover p-1 shadow-md">
          {options.map((option) => {
            const selected = value.includes(option.value)
            return (
              <button
                key={option.value}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent',
                  selected && 'bg-accent'
                )}
                onClick={() => toggle(option.value)}
              >
                <div className={cn(
                  'flex size-4 items-center justify-center rounded border',
                  selected ? 'bg-primary border-primary text-primary-foreground' : 'border-input'
                )}>
                  {selected && <Check className="size-3" />}
                </div>
                {option.label}
              </button>
            )
          })}
          {value.length > 0 && (
            <button
              className="mt-1 w-full border-t pt-2 text-center text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                onChange([])
                setIsOpen(false)
              }}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export type { Option, MultiSelectFilterProps }
