import { useEffect, useState } from 'react';

/** Returns true when the media query matches. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    mql.addEventListener('change', handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** Convenience: true when viewport is < 768px (mobile). */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/** Convenience: true when viewport >= 1024px (desktop). */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
