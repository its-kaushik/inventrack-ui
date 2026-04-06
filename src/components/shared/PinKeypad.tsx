'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Delete } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

interface PinKeypadProps {
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  maxLength?: number;
  title?: string;
  className?: string;
}

const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export function PinKeypad({
  onSubmit,
  onCancel,
  maxLength = 4,
  title = 'Enter Owner PIN',
  className,
}: PinKeypadProps) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockRemaining, setLockRemaining] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;
  const isComplete = pin.length === maxLength;

  // Update lockout countdown
  useEffect(() => {
    if (!lockedUntil) return;

    const updateRemaining = () => {
      const remaining = lockedUntil - Date.now();
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setLockRemaining('');
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      const mins = Math.ceil(remaining / 60000);
      setLockRemaining(`Try again in ${mins} min`);
    };

    updateRemaining();
    intervalRef.current = setInterval(updateRemaining, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lockedUntil]);

  const appendDigit = useCallback(
    (digit: string) => {
      if (isLocked) return;
      setPin((prev) => {
        if (prev.length >= maxLength) return prev;
        return prev + digit;
      });
    },
    [maxLength, isLocked],
  );

  const deleteDigit = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!isComplete || isLocked) return;

    const newAttempts = attempts + 1;

    // We always call onSubmit - the parent decides if the PIN is correct.
    // If the parent wants to signal an error, they can call the component
    // without unmounting it, and we'll detect it hasn't been closed.
    onSubmit(pin);

    // After submit, clear the pin and increment attempts.
    // If the parent closes the overlay (success), this state is discarded.
    // If the parent keeps it open (failure), the attempt counter persists.
    setPin('');
    setAttempts(newAttempts);

    if (newAttempts >= MAX_ATTEMPTS) {
      setLockedUntil(Date.now() + LOCKOUT_DURATION_MS);
    } else {
      // Trigger shake for visual feedback that PIN was tried
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }, [pin, isComplete, isLocked, attempts, onSubmit]);

  // Handle physical keyboard input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isLocked) return;
      if (e.key >= '0' && e.key <= '9') {
        appendDigit(e.key);
      } else if (e.key === 'Backspace') {
        deleteDigit();
      } else if (e.key === 'Enter' && isComplete) {
        handleSubmit();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [appendDigit, deleteDigit, handleSubmit, isComplete, isLocked, onCancel]);

  const keypadButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'];

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm',
        className,
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="mx-4 w-full max-w-xs rounded-2xl bg-card p-6 shadow-modal">
        {/* Title */}
        <h2 className="mb-6 text-center text-lg font-semibold text-foreground">
          {title}
        </h2>

        {/* PIN dots */}
        <div
          className={cn(
            'mb-6 flex items-center justify-center gap-3',
            shake && 'animate-shake',
          )}
          aria-live="polite"
          aria-label={`PIN: ${pin.length} of ${maxLength} digits entered`}
        >
          {Array.from({ length: maxLength }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'size-4 rounded-full border-2 transition-colors',
                i < pin.length
                  ? 'border-primary-600 bg-primary-600'
                  : 'border-neutral-300 bg-transparent',
              )}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Lockout message */}
        {isLocked && (
          <p className="mb-4 text-center text-sm font-medium text-error-500" role="alert">
            Too many attempts. {lockRemaining}
          </p>
        )}

        {/* Keypad grid */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          {keypadButtons.map((key, i) => {
            if (key === '') {
              return <div key={i} aria-hidden="true" />;
            }

            if (key === 'backspace') {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={deleteDigit}
                  disabled={pin.length === 0 || isLocked}
                  className={cn(
                    'flex min-h-[60px] min-w-[60px] items-center justify-center rounded-xl text-foreground transition-colors',
                    'hover:bg-neutral-100 active:bg-neutral-200',
                    'disabled:cursor-not-allowed disabled:opacity-40',
                  )}
                  aria-label="Delete"
                >
                  <Delete className="size-6" />
                </button>
              );
            }

            return (
              <button
                key={i}
                type="button"
                onClick={() => appendDigit(key)}
                disabled={pin.length >= maxLength || isLocked}
                className={cn(
                  'flex min-h-[60px] min-w-[60px] items-center justify-center rounded-xl text-xl font-medium text-foreground transition-colors',
                  'hover:bg-neutral-100 active:bg-neutral-200',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                )}
              >
                {key}
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-11 flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isComplete || isLocked}
            className="h-11 flex-1"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
