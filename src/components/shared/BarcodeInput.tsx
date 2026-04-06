'use client';

import { useCallback, useRef, useState } from 'react';
import { ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { CONSTANTS } from '@/config/constants';

interface BarcodeInputProps {
  onSubmit: (barcode: string) => void;
  onCameraRequest?: () => void;
  placeholder?: string;
  className?: string;
}

export function BarcodeInput({
  onSubmit,
  onCameraRequest,
  placeholder = 'Scan or type barcode',
  className,
}: BarcodeInputProps) {
  const [value, setValue] = useState('');
  const keystrokeTimestamps = useRef<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      onSubmit(trimmed);
      setValue('');
      keystrokeTimestamps.current = [];
    }
  }, [value, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const now = Date.now();

      if (e.key === 'Enter') {
        e.preventDefault();

        // Check if this was a rapid scan (hardware scanner)
        const timestamps = keystrokeTimestamps.current;
        if (timestamps.length >= 2) {
          const allRapid = timestamps.every((ts, i) => {
            if (i === 0) return true;
            return ts - timestamps[i - 1] < CONSTANTS.POS.BARCODE_RAPID_KEYSTROKE_MS;
          });

          if (allRapid) {
            // Hardware scanner detected — auto-submit
            const trimmed = value.trim();
            if (trimmed.length > 0) {
              onSubmit(trimmed);
              setValue('');
              keystrokeTimestamps.current = [];
              return;
            }
          }
        }

        // Manual entry submit
        handleSubmit();
        return;
      }

      // Track keystroke timing for scanner detection
      if (e.key.length === 1) {
        keystrokeTimestamps.current.push(now);
        // Keep only the last 50 timestamps to prevent unbounded growth
        if (keystrokeTimestamps.current.length > 50) {
          keystrokeTimestamps.current = keystrokeTimestamps.current.slice(-50);
        }
      }
    },
    [value, onSubmit, handleSubmit],
  );

  return (
    <div className={cn('flex gap-2', className)}>
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          'h-11 flex-1 rounded-lg border border-input bg-background px-3 text-base text-foreground',
          'placeholder:text-muted-foreground',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'outline-none transition-colors',
        )}
        aria-label={placeholder}
        autoComplete="off"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => onCameraRequest?.()}
        className="h-11 shrink-0 gap-1.5 px-3"
        aria-label="Open camera scanner"
      >
        <ScanLine className="size-5" />
        <span className="hidden sm:inline">Scan</span>
      </Button>
    </div>
  );
}
