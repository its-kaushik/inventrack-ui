'use client';

import { useCallback, useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
} from 'date-fns';
import { cn } from '@/lib/cn';
import { getFYStartDate, getFYEndDate } from '@/lib/financial-year';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  className?: string;
}

type Preset = {
  label: string;
  getRange: () => [Date, Date] | [null, null];
};

function formatDateForInput(date: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value + 'T00:00:00');
  return isNaN(date.getTime()) ? null : date;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  className,
}: DateRangePickerProps) {
  const today = useMemo(() => new Date(), []);

  const presets: Preset[] = useMemo(
    () => [
      {
        label: 'Today',
        getRange: () => [today, today],
      },
      {
        label: 'This Week',
        getRange: () => [
          startOfWeek(today, { weekStartsOn: 1 }),
          endOfWeek(today, { weekStartsOn: 1 }),
        ],
      },
      {
        label: 'This Month',
        getRange: () => [startOfMonth(today), endOfMonth(today)],
      },
      {
        label: 'This Quarter',
        getRange: () => [startOfQuarter(today), endOfQuarter(today)],
      },
      {
        label: 'This FY',
        getRange: () => [getFYStartDate(today), getFYEndDate(today)],
      },
      {
        label: 'Custom',
        getRange: () => [null, null],
      },
    ],
    [today],
  );

  // Determine which preset is currently active
  const activePreset = useMemo(() => {
    if (!startDate && !endDate) return 'Custom';
    for (const preset of presets) {
      if (preset.label === 'Custom') continue;
      const [s, e] = preset.getRange();
      if (
        s &&
        e &&
        startDate &&
        endDate &&
        formatDateForInput(s) === formatDateForInput(startDate) &&
        formatDateForInput(e) === formatDateForInput(endDate)
      ) {
        return preset.label;
      }
    }
    return null;
  }, [startDate, endDate, presets]);

  const handlePresetClick = useCallback(
    (preset: Preset) => {
      const [start, end] = preset.getRange();
      onChange(start, end);
    },
    [onChange],
  );

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Date inputs */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Start
          </label>
          <input
            type="date"
            value={formatDateForInput(startDate)}
            onChange={(e) => onChange(parseDateInput(e.target.value), endDate)}
            className={cn(
              'h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground',
              'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
              'outline-none transition-colors',
            )}
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            End
          </label>
          <input
            type="date"
            value={formatDateForInput(endDate)}
            onChange={(e) => onChange(startDate, parseDateInput(e.target.value))}
            min={startDate ? formatDateForInput(startDate) : undefined}
            className={cn(
              'h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground',
              'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
              'outline-none transition-colors',
            )}
          />
        </div>
      </div>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handlePresetClick(preset)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              activePreset === preset.label
                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-transparent',
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
