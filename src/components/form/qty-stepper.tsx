import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface QtyStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  className?: string
}

export function QtyStepper({
  value,
  onChange,
  min = 0,
  max,
  className,
}: QtyStepperProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState(String(value))

  const clamp = (v: number) => {
    let clamped = Math.max(min, v)
    if (max !== undefined) clamped = Math.min(max, clamped)
    return clamped
  }

  const handleDecrement = () => {
    onChange(clamp(value - 1))
  }

  const handleIncrement = () => {
    onChange(clamp(value + 1))
  }

  const handleInputBlur = () => {
    setIsEditing(false)
    const parsed = parseInt(inputValue, 10)
    if (!isNaN(parsed)) {
      onChange(clamp(parsed))
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      ;(e.target as HTMLInputElement).blur()
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        variant="outline"
        size="icon-xs"
        onClick={handleDecrement}
        disabled={value <= min}
      >
        <Minus className="size-3" />
      </Button>

      {isEditing ? (
        <Input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value.replace(/[^0-9]/g, ''))}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="h-6 w-12 text-center text-sm px-1"
          autoFocus
        />
      ) : (
        <button
          className="flex h-6 w-10 items-center justify-center rounded-md text-sm font-medium tabular-nums hover:bg-muted"
          onClick={() => {
            setInputValue(String(value))
            setIsEditing(true)
          }}
        >
          {value}
        </button>
      )}

      <Button
        variant="outline"
        size="icon-xs"
        onClick={handleIncrement}
        disabled={max !== undefined && value >= max}
      >
        <Plus className="size-3" />
      </Button>
    </div>
  )
}
