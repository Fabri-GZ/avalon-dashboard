import { getStatusColors } from '@/lib/pm/utils'
import type { ReportStatus } from '@/lib/pm/types'

export function StatusDot({ status }: { status: ReportStatus | null | undefined }) {
  const colors = getStatusColors(status)
  return (
    <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
  )
}
