import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormStepperProps {
  steps: { label: string }[]
  currentStep: number
  className?: string
}

export function FormStepper({ steps, currentStep, className }: FormStepperProps) {
  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              {/* Step circle */}
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                  isCompleted &&
                    'border-primary bg-primary text-primary-foreground',
                  isCurrent &&
                    'border-primary bg-background text-primary',
                  !isCompleted &&
                    !isCurrent &&
                    'border-muted-foreground/30 bg-background text-muted-foreground/50'
                )}
              >
                {isCompleted ? <Check className="size-4" /> : index + 1}
              </div>
              {/* Step label */}
              <span
                className={cn(
                  'max-w-[5rem] text-center text-[11px] leading-tight',
                  isCurrent
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground',
                  isCompleted && 'text-foreground'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  'mx-2 mt-[-1.25rem] h-0.5 w-8 sm:w-12',
                  isCompleted ? 'bg-primary' : 'bg-muted-foreground/20'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
