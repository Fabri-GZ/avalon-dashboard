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
      className={`flex flex-col items-center text-center rounded-card p-4 shadow-card transition-all border-2 ${
        isActive ? '' : 'border-transparent bg-white'
      }`}
      style={
        isActive
          ? { borderColor: colors.border, backgroundColor: colors.bgResting }
          : {}
      }
    >
      <span className={`inline-block w-3 h-3 rounded-full mb-2 ${colors.dot}`} />
      <span className="font-unbounded text-sm font-bold text-text">{label}</span>
      <span className="text-xs text-text-muted font-poppins mt-0.5">{desc}</span>
    </div>
  )
}
