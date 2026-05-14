import type { ReportStatus } from '@/lib/pm/types'
import { getStatusColors } from '@/lib/pm/utils'

const CONFIG = {
  green:  { label: 'Verde',    desc: 'Ejecución alineada' },
  yellow: { label: 'Amarillo', desc: 'Desvíos leves' },
  red:    { label: 'Rojo',     desc: 'Riesgo de incumplimiento' },
}

export function SemaphoreCard({
  value,
  activeStatus,
}: {
  value: ReportStatus
  activeStatus: ReportStatus | null
}) {
  const isActive = activeStatus === value
  const colors = getStatusColors(value)
  const { label, desc } = CONFIG[value]

  return (
    <div
      className={`flex flex-col items-center text-center rounded-xl p-4 shadow-sm transition-all border-2 ${
        isActive ? 'bg-card' : 'border-transparent bg-card'
      }`}
      style={
        isActive
          ? { borderColor: colors.border, backgroundColor: colors.bgResting }
          : {}
      }
    >
      <span className={`inline-block w-3 h-3 rounded-full mb-2 ${colors.dot}`} />
      <span className="text-sm font-bold text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground mt-0.5">{desc}</span>
    </div>
  )
}
