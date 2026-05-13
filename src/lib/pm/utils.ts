import type { ReportStatus } from './types'

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export function isOverdue(dueDate: string | null, completed: boolean): boolean {
  if (!dueDate || completed) return false
  return new Date(dueDate) < new Date(new Date().toDateString())
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year = d.getUTCFullYear()
  return `${day}/${month}/${year}`
}

const STATUS_LABELS: Record<string, string> = {
  green: 'Al día',
  yellow: 'Atención',
  red: 'Crítico',
}

export function getStatusLabel(status: string | null | undefined): string {
  if (!status) return 'Sin reporte'
  return STATUS_LABELS[status] ?? status
}

export interface StatusColors {
  bgResting: string
  bgActive: string
  avatarBg: string
  avatarText: string
  dot: string
  badge: string
  badgeText: string
  border: string
}

export function getStatusColors(status: ReportStatus | null | undefined): StatusColors {
  switch (status) {
    case 'green':
      return {
        bgResting: 'rgba(34, 197, 94, 0.08)',
        bgActive: 'rgba(34, 197, 94, 0.22)',
        avatarBg: 'rgba(34, 197, 94, 0.18)',
        avatarText: '#16a34a',
        dot: 'bg-green-400',
        badge: 'bg-green-50',
        badgeText: 'text-green-700',
        border: '#22c55e',
      }
    case 'yellow':
      return {
        bgResting: 'rgba(234, 179, 8, 0.09)',
        bgActive: 'rgba(234, 179, 8, 0.22)',
        avatarBg: 'rgba(234, 179, 8, 0.18)',
        avatarText: '#b45309',
        dot: 'bg-yellow-400',
        badge: 'bg-yellow-50',
        badgeText: 'text-yellow-700',
        border: '#eab308',
      }
    case 'red':
      return {
        bgResting: 'rgba(239, 68, 68, 0.08)',
        bgActive: 'rgba(239, 68, 68, 0.20)',
        avatarBg: 'rgba(239, 68, 68, 0.18)',
        avatarText: '#dc2626',
        dot: 'bg-red-400',
        badge: 'bg-red-50',
        badgeText: 'text-red-700',
        border: '#ef4444',
      }
    default:
      return {
        bgResting: 'transparent',
        bgActive: 'rgba(124, 58, 237, 0.08)',
        avatarBg: '#f3f4f6',
        avatarText: '#6b7280',
        dot: 'bg-gray-300',
        badge: 'bg-gray-100',
        badgeText: 'text-gray-500',
        border: '#d1d5db',
      }
  }
}
