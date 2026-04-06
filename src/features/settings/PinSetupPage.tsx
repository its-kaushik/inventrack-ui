import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PinKeypad } from '@/components/shared';
import { PageHeader } from '@/components/layout';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/api/client';
import { toast } from 'sonner';
import { KeyRound, ShieldCheck, Lock } from 'lucide-react';

type PinStep = 'idle' | 'verify-current' | 'enter-new' | 'confirm-new';

export default function PinSetupPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // We track whether the user has a PIN based on a simple flag.
  // On first load we assume "unknown" and let the user choose.
  // If they click "Change PIN", we verify first; if "Set PIN", they go straight to entry.
  const [hasPinSet, setHasPinSet] = useState<boolean | null>(null);
  const [step, setStep] = useState<PinStep>('idle');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifyError, setVerifyError] = useState(false);

  // ── Verify current PIN ──

  const handleVerifyCurrentPin = useCallback(
    async (pin: string) => {
      setVerifyError(false);
      try {
        await api.post('auth/pin/verify', { json: { pin } }).json();
        setCurrentPin(pin);
        setStep('enter-new');
      } catch {
        setVerifyError(true);
        toast.error('Incorrect PIN. Please try again.');
      }
    },
    [],
  );

  // ── Enter new PIN ──

  const handleNewPin = useCallback((pin: string) => {
    setNewPin(pin);
    setStep('confirm-new');
  }, []);

  // ── Confirm new PIN ──

  const handleConfirmPin = useCallback(
    async (pin: string) => {
      if (pin !== newPin) {
        toast.error('PINs do not match. Please try again.');
        setStep('enter-new');
        setNewPin('');
        return;
      }

      setIsSubmitting(true);
      try {
        const payload: { pin: string; currentPin?: string } = { pin };
        if (currentPin) {
          payload.currentPin = currentPin;
        }
        await api.post('auth/pin', { json: payload }).json();
        toast.success('PIN saved successfully');
        setHasPinSet(true);
        setStep('idle');
        setCurrentPin('');
        setNewPin('');
      } catch {
        toast.error('Failed to save PIN. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [newPin, currentPin],
  );

  // ── Cancel handler ──

  const handleCancel = useCallback(() => {
    setStep('idle');
    setCurrentPin('');
    setNewPin('');
    setVerifyError(false);
  }, []);

  // ── Determine which keypad to show ──

  if (step === 'verify-current') {
    return (
      <PinKeypad
        title="Enter Current PIN"
        onSubmit={handleVerifyCurrentPin}
        onCancel={handleCancel}
      />
    );
  }

  if (step === 'enter-new') {
    return (
      <PinKeypad
        title="Enter New PIN"
        onSubmit={handleNewPin}
        onCancel={handleCancel}
      />
    );
  }

  if (step === 'confirm-new') {
    return (
      <PinKeypad
        title="Confirm New PIN"
        onSubmit={handleConfirmPin}
        onCancel={handleCancel}
      />
    );
  }

  // ── Idle State ──

  return (
    <div>
      <PageHeader
        title="Owner PIN"
        showBack
        onBack={() => navigate('/settings')}
      />

      <div className="px-4 pb-8 desktop:px-6">
        <Card className="mx-auto max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-primary-50">
              <KeyRound className="size-7 text-primary-600" />
            </div>
            <CardTitle className="text-lg">
              {hasPinSet === false ? 'Set Your PIN' : 'Owner PIN'}
            </CardTitle>
            <CardDescription>
              Your 4-digit PIN is used to approve discount overrides and bill
              voids. Keep it private.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* PIN Status */}
            {hasPinSet === null && (
              <div className="rounded-lg bg-neutral-50 p-4 text-center">
                <p className="text-sm text-neutral-600">
                  Choose an action below to set or change your PIN.
                </p>
              </div>
            )}

            {hasPinSet === true && (
              <div className="flex items-center gap-3 rounded-lg bg-success-50 p-4">
                <ShieldCheck className="size-5 shrink-0 text-success-600" />
                <p className="text-sm font-medium text-success-700">
                  PIN is active and configured.
                </p>
              </div>
            )}

            {hasPinSet === false && (
              <div className="flex items-center gap-3 rounded-lg bg-warning-50 p-4">
                <Lock className="size-5 shrink-0 text-warning-600" />
                <p className="text-sm font-medium text-warning-700">
                  No PIN set yet. Set a PIN to enable discount approval and bill
                  void authorization.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {/* Set PIN (first time) */}
              {(hasPinSet === null || hasPinSet === false) && (
                <Button
                  className="h-11 w-full touch-target"
                  onClick={() => {
                    setHasPinSet(false);
                    setCurrentPin('');
                    setStep('enter-new');
                  }}
                >
                  Set New PIN
                </Button>
              )}

              {/* Change PIN (already set) */}
              {(hasPinSet === null || hasPinSet === true) && (
                <Button
                  variant={hasPinSet === true ? 'default' : 'outline'}
                  className="h-11 w-full touch-target"
                  onClick={() => {
                    setHasPinSet(true);
                    setStep('verify-current');
                  }}
                >
                  Change Existing PIN
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
