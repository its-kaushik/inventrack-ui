import { formatDistanceToNow } from 'date-fns'

function toDate(date: Date | string): Date {
  return typeof date === 'string' ? new Date(date) : date
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

export function formatDate(date: Date | string): string {
  const d = toDate(date)
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`
}

export function formatDateTime(date: Date | string): string {
  const d = toDate(date)
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(toDate(date), { addSuffix: true })
}
