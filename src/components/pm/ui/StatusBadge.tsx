import { getStatusColors } from '@/lib/pm/utils'
import type { ReportStatus } from '@/lib/pm/types'

const LABELS: Record<string, string> = {
  green: 'Al día',
  yellow: 'Atención',
  red: 'Crítico',
}

export function StatusBadge({ status }: { status: ReportStatus | null | undefined }) {
  if (!status) return null
  const colors = getStatusColors(status)
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-poppins ${colors.badge} ${colors.badgeText}`}
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {LABELS[status] ?? status}
    </span>
  )
}
