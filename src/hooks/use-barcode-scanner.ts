import { useEffect, useRef, useCallback } from 'react';
import { CONSTANTS } from '@/config/constants';

/**
 * Detects hardware barcode scanner input (rapid keystrokes < 50ms apart).
 * Calls `onScan` when a complete barcode is detected (Enter key finishes the scan).
 * Ignores normal human typing speed.
 */
export function useBarcodeScanner(onScan: (barcode: string) => void) {
  const bufferRef = useRef('');
  const lastKeystrokeRef = useRef(0);
  const stableOnScan = useCallback(onScan, [onScan]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea (scanner should target the barcode field)
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const now = Date.now();
      const elapsed = now - lastKeystrokeRef.current;
      lastKeystrokeRef.current = now;

      if (e.key === 'Enter') {
        // Scanner finished — submit if we have a buffer from rapid keystrokes
        if (bufferRef.current.length >= 3) {
          stableOnScan(bufferRef.current);
        }
        bufferRef.current = '';
        return;
      }

      // If keystrokes are rapid enough (< threshold), accumulate
      if (elapsed < CONSTANTS.POS.BARCODE_RAPID_KEYSTROKE_MS || bufferRef.current.length === 0) {
        if (e.key.length === 1) {
          bufferRef.current += e.key;
        }
      } else {
        // Too slow — human typing, reset buffer
        bufferRef.current = e.key.length === 1 ? e.key : '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stableOnScan]);
}
