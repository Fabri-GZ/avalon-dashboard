import { Card } from '@/components/ui/card'
import type { FeedStats } from '@/lib/pm/types'

interface StatsPillsProps {
  stats: FeedStats
}

interface PillProps {
  value: number
  label: string
  emphasis?: 'urgent' | 'warn' | 'default'
}

function Pill({ value, label, emphasis = 'default' }: PillProps) {
  const valueClasses =
    emphasis === 'urgent'
      ? 'text-destructive'
      : emphasis === 'warn'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-foreground'

  return (
    <Card className="flex-1 gap-1 py-3">
      <div className={`px-4 text-2xl font-bold leading-tight ${valueClasses}`}>
        {value}
      </div>
      <div className="px-4 text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
    </Card>
  )
}

export function StatsPills({ stats }: StatsPillsProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-5">
      <Pill value={stats.overdue} label="Vencidas" emphasis="urgent" />
      <Pill value={stats.thisWeek} label="Esta semana" emphasis="warn" />
      <Pill value={stats.withoutBrief} label="Sin brief" />
      <Pill value={stats.activeClients} label="Clientes activos" />
    </div>
  )
}
