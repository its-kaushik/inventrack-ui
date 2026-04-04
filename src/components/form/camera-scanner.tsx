import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CameraScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export function CameraScanner({ onScan, onClose }: CameraScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const containerId = 'camera-scanner-container'

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          onScan(decodedText)
          // Stop after successful scan
          scanner.stop().catch(() => {})
          onClose()
        },
        () => {}, // ignore errors during scanning
      )
      .catch((err: unknown) => {
        setError('Camera access denied or not available')
        console.error('Scanner start error:', err)
      })

    return () => {
      // Robust cleanup
      try {
        if (scanner.isScanning) {
          scanner.stop().catch(() => {})
        }
      } catch {
        // Force stop all video tracks
      }
      // Force-stop all video tracks as fallback
      navigator.mediaDevices
        ?.getUserMedia({ video: true })
        .then((stream) => {
          stream.getTracks().forEach((track) => track.stop())
        })
        .catch(() => {})
    }
  }, [onScan, onClose])

  return (
    <div className="relative rounded-lg overflow-hidden bg-black">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 text-white bg-black/50"
        onClick={onClose}
      >
        <X className="size-4" />
      </Button>
      <div id={containerId} className="w-full" />
      {error && (
        <div className="p-4 text-center text-sm text-destructive bg-background">
          {error}
        </div>
      )}
    </div>
  )
}
