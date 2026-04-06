import { createContext, useContext } from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';

// ── Types ──

interface OnlineStatusContextValue {
  isOnline: boolean;
}

// ── Context ──

const OnlineStatusContext = createContext<OnlineStatusContextValue>({
  isOnline: true,
});

// ── Provider ──

export function OnlineStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isOnline = useOnlineStatus();

  return (
    <OnlineStatusContext.Provider value={{ isOnline }}>
      {children}
    </OnlineStatusContext.Provider>
  );
}

// ── Consumer hook ──

export function useOnlineStatusContext(): OnlineStatusContextValue {
  const ctx = useContext(OnlineStatusContext);
  if (ctx === undefined) {
    throw new Error(
      'useOnlineStatusContext must be used within an OnlineStatusProvider',
    );
  }
  return ctx;
}
