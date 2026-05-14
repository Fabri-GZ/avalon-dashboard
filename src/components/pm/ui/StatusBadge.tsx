import type { ReportStatus } from '@/lib/pm/types'

const LABELS: Record<ReportStatus, string> = {
  green:  'Al día',
  yellow: 'Atención',
  red:    'Crítico',
}

const STYLES: Record<ReportStatus, { wrap: string; dot: string }> = {
  green: {
    wrap: 'bg-green-500/15 text-green-700 dark:text-green-400',
    dot:  'bg-green-500',
  },
  yellow: {
    wrap: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    dot:  'bg-amber-500',
  },
  red: {
    wrap: 'bg-destructive/15 text-destructive',
    dot:  'bg-destructive',
  },
}

export function StatusBadge({ status }: { status: ReportStatus | null | undefined }) {
  if (!status) return null
  const styles = STYLES[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${styles.wrap}`}
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      {LABELS[status] ?? status}
    </span>
  )
}
