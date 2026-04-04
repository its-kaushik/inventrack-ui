import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

function formatWithCommas(num: number): string {
  if (num === 0) return '0'
  return num.toLocaleString('en-IN')
}

function parseValue(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = '0',
  disabled,
  className,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState(
    value ? formatWithCommas(value) : ''
  )
  const [isFocused, setIsFocused] = useState(false)

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    // Show raw number for editing
    setDisplayValue(value ? String(value) : '')
  }, [value])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    const parsed = parseValue(displayValue)
    onChange(parsed)
    setDisplayValue(parsed ? formatWithCommas(parsed) : '')
  }, [displayValue, onChange])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      // Allow only digits and one decimal point during editing
      if (/^[0-9]*\.?[0-9]*$/.test(raw)) {
        setDisplayValue(raw)
      }
    },
    []
  )

  return (
    <div className={cn('relative', className)}>
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        ₹
      </span>
      <Input
        inputMode="decimal"
        value={isFocused ? displayValue : (value ? formatWithCommas(value) : '')}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="pl-7 font-mono tabular-nums text-right"
      />
    </div>
  )
}
