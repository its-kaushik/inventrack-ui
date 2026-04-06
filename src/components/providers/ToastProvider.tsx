import { Toaster } from '@/components/ui/sonner';
import { toast as sonnerToast } from 'sonner';

// ── Provider ──

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-center"
      duration={3000}
      richColors
    />
  );
}

// ── Toast helper ──
// Convenience wrapper around sonner's toast function with
// pre-configured methods for the most common use-cases.

export const toast = {
  success(message: string, description?: string) {
    sonnerToast.success(message, { description });
  },

  error(message: string, description?: string) {
    sonnerToast.error(message, { description });
  },

  info(message: string, description?: string) {
    sonnerToast.info(message, { description });
  },
} as const;
