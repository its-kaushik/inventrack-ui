import { format, parseISO, isValid } from 'date-fns';

/** Parse ISO string or Date, returns null if invalid. */
function toDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  const d = typeof input === 'string' ? parseISO(input) : input;
  return isValid(d) ? d : null;
}

/** Format as "05 Apr 2026" */
export function formatDate(input: string | Date | null | undefined): string {
  const d = toDate(input);
  return d ? format(d, 'dd MMM yyyy') : '—';
}

/** Format as "05 Apr 2026, 2:30 PM" */
export function formatDateTime(input: string | Date | null | undefined): string {
  const d = toDate(input);
  return d ? format(d, 'dd MMM yyyy, h:mm a') : '—';
}

/** Format as "2:30 PM" */
export function formatTime(input: string | Date | null | undefined): string {
  const d = toDate(input);
  return d ? format(d, 'h:mm a') : '—';
}

/** Format as "05/04/2026" (DD/MM/YYYY — Indian format) */
export function formatDateShort(input: string | Date | null | undefined): string {
  const d = toDate(input);
  return d ? format(d, 'dd/MM/yyyy') : '—';
}

/** Format as "Apr 2026" */
export function formatMonthYear(input: string | Date | null | undefined): string {
  const d = toDate(input);
  return d ? format(d, 'MMM yyyy') : '—';
}

/** Format as ISO date string "2026-04-05" for API params. */
export function toISODate(input: Date): string {
  return format(input, 'yyyy-MM-dd');
}
