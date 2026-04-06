import { useEffect, useCallback } from 'react';

/**
 * Intercepts browser back button when `shouldBlock` is true.
 * Calls `onBlock` instead of navigating away.
 * Used in POS to prevent accidental navigation with unsaved cart items.
 */
export function useBackGuard(shouldBlock: boolean, onBlock: () => void) {
  const stableOnBlock = useCallback(onBlock, [onBlock]);

  useEffect(() => {
    if (!shouldBlock) return;

    // Push a guard state so popstate fires when user presses back
    window.history.pushState({ guard: true }, '');

    const handlePopState = () => {
      // Re-push so the guard stays active
      window.history.pushState({ guard: true }, '');
      stableOnBlock();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [shouldBlock, stableOnBlock]);
}
