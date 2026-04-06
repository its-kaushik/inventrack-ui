'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface MultiSelectChipsProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allowCustom?: boolean;
  placeholder?: string;
  className?: string;
}

export function MultiSelectChips({
  options,
  selected,
  onChange,
  allowCustom = false,
  placeholder = 'Add custom...',
  className,
}: MultiSelectChipsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const toggleChip = useCallback(
    (option: string) => {
      if (selected.includes(option)) {
        onChange(selected.filter((s) => s !== option));
      } else {
        onChange([...selected, option]);
      }
    },
    [selected, onChange],
  );

  const handleAddCustom = useCallback(() => {
    const trimmed = customValue.trim();
    if (trimmed.length > 0 && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setCustomValue('');
    setIsAdding(false);
  }, [customValue, selected, onChange]);

  const handleCustomKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddCustom();
      } else if (e.key === 'Escape') {
        setCustomValue('');
        setIsAdding(false);
      }
    },
    [handleAddCustom],
  );

  // Combine options and any selected values not in original options (custom ones)
  const allOptions = [
    ...options,
    ...selected.filter((s) => !options.includes(s)),
  ];

  return (
    <div
      className={cn(
        'flex flex-wrap gap-2 overflow-x-auto scrollbar-none',
        className,
      )}
      role="group"
      aria-label="Selection chips"
    >
      {allOptions.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggleChip(option)}
            className={cn(
              'inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              'touch-target',
              isSelected
                ? 'border-primary-200 bg-primary-100 text-primary-700'
                : 'border-transparent bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
            )}
            aria-pressed={isSelected}
          >
            {option}
          </button>
        );
      })}

      {allowCustom && !isAdding && (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-neutral-300 bg-transparent px-3 py-1.5 text-sm font-medium text-neutral-500 transition-colors',
            'hover:border-primary-300 hover:text-primary-600',
            'touch-target',
          )}
          aria-label="Add custom option"
        >
          <Plus className="size-3.5" />
          Add
        </button>
      )}

      {allowCustom && isAdding && (
        <input
          type="text"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={handleCustomKeyDown}
          onBlur={handleAddCustom}
          placeholder={placeholder}
          className="h-8 w-28 rounded-full border border-primary-300 bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          autoFocus
        />
      )}
    </div>
  );
}
