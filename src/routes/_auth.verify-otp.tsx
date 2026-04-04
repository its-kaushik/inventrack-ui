import { useState, useRef, useEffect, useCallback } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Phone } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { verifyOtp, resendOtp } from '@/api/auth.api'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const searchParamsSchema = z.object({
  phone: z.string().optional(),
})

export const Route = createFileRoute('/_auth/verify-otp')({
  validateSearch: searchParamsSchema,
  component: VerifyOtpPage,
})

const OTP_LENGTH = 6
const TIMER_DURATION = 120

function VerifyOtpPage() {
  const { phone } = Route.useSearch()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(TIMER_DURATION)

  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [timer])

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const maskedPhone = phone
    ? phone.replace(/(\d{2})\d+(\d{2})/, '$1****$2')
    : '**********'

  const submitOtp = useCallback(
    async (otpValue: string) => {
      if (!phone) {
        setError('Phone number is missing. Please go back and try again.')
        return
      }
      setIsVerifying(true)
      setError('')
      try {
        const res = await verifyOtp(phone, otpValue)
        const { accessToken, user } = res.data
        setAuth(user, accessToken, user.tenant ?? null)
        toast.success('Verification successful')
        navigate({ to: '/' })
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Invalid OTP. Please try again.'
        )
        // Clear OTP and focus first input
        setOtp(Array(OTP_LENGTH).fill(''))
        inputRefs.current[0]?.focus()
      } finally {
        setIsVerifying(false)
      }
    },
    [phone, setAuth, navigate]
  )

  const handleChange = useCallback(
    (index: number, value: string) => {
      // Only accept numeric input
      if (value && !/^\d$/.test(value)) return

      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)
      setError('')

      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus()
      }

      // Auto-submit when all digits filled
      if (value && newOtp.every((d) => d !== '')) {
        submitOtp(newOtp.join(''))
      }
    },
    [otp, submitOtp]
  )

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (!otp[index] && index > 0) {
          inputRefs.current[index - 1]?.focus()
          const newOtp = [...otp]
          newOtp[index - 1] = ''
          setOtp(newOtp)
        }
      }
    },
    [otp]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault()
      const pastedData = e.clipboardData
        .getData('text')
        .replace(/\D/g, '')
        .slice(0, OTP_LENGTH)
      if (!pastedData) return

      const newOtp = Array(OTP_LENGTH).fill('')
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i]
      }
      setOtp(newOtp)
      setError('')

      // Focus last filled or next empty
      const nextIndex = Math.min(pastedData.length, OTP_LENGTH - 1)
      inputRefs.current[nextIndex]?.focus()

      // Auto-submit if all filled
      if (newOtp.every((d) => d !== '')) {
        submitOtp(newOtp.join(''))
      }
    },
    [submitOtp]
  )

  const handleResend = async () => {
    if (!phone || timer > 0) return
    setIsResending(true)
    try {
      await resendOtp(phone)
      setTimer(TIMER_DURATION)
      toast.success('OTP resent successfully')
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to resend OTP'
      )
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">InvenTrack</h1>
        <p className="text-muted-foreground text-sm">Verify your phone number</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enter OTP</CardTitle>
          <CardDescription>
            <span className="flex items-center gap-1.5">
              <Phone className="size-3.5" />
              We sent a 6-digit code to {maskedPhone}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* OTP Input boxes */}
          <div className="flex justify-center gap-2">
            {Array.from({ length: OTP_LENGTH }).map((_, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[index]}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={isVerifying}
                autoFocus={index === 0}
                className="flex size-12 items-center justify-center rounded-lg border border-input bg-transparent text-center text-lg font-semibold transition-colors outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {/* Timer and resend */}
          <div className="text-center text-sm">
            {timer > 0 ? (
              <p className="text-muted-foreground">
                Resend code in{' '}
                <span className="font-medium text-foreground">
                  {formatTimer(timer)}
                </span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? 'Sending...' : "Didn't receive code? Resend OTP"}
              </button>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            disabled={isVerifying || otp.some((d) => d === '')}
            onClick={() => submitOtp(otp.join(''))}
          >
            {isVerifying && <Loader2 className="size-4 animate-spin" />}
            Verify
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
