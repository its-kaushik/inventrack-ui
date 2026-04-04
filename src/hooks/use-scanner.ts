import { useEffect, useRef, useCallback } from 'react'

interface UseScannerOptions {
  onScan: (barcode: string) => void
  enabled?: boolean
  minLength?: number // minimum barcode length (default 4)
  maxGap?: number // max ms between keystrokes to consider it a scan (default 80)
}

export function useScanner({
  onScan,
  enabled = true,
  minLength = 4,
  maxGap = 80,
}: UseScannerOptions) {
  const bufferRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  const flush = useCallback(() => {
    const barcode = bufferRef.current.trim()
    if (barcode.length >= minLength) {
      onScanRef.current(barcode)
    }
    bufferRef.current = ''
  }, [minLength])

  useEffect(() => {
    if (!enabled) return

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input field
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'Enter') {
        if (timerRef.current) clearTimeout(timerRef.current)
        flush()
        return
      }

      // Only accept printable characters
      if (e.key.length === 1) {
        bufferRef.current += e.key
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(flush, maxGap)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [enabled, flush, maxGap])
}
