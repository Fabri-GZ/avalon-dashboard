import type { TrendResponse } from '@/lib/agente-ia/types'

interface MetaBadgeProps {
  meta: TrendResponse['meta']
}

export function MetaBadge({ meta }: MetaBadgeProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1 font-medium text-foreground shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        Últimos {meta.windowDays}d
      </span>

      {meta.platforms.map((p) => (
        <span
          key={p}
          className="inline-flex items-center rounded-full border border-border/70 bg-card px-2.5 py-1 font-medium capitalize text-muted-foreground shadow-sm"
        >
          {p}
        </span>
      ))}

      {meta.hashtags.slice(0, 4).map((h) => (
        <span
          key={h}
          className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary"
        >
          {h}
        </span>
      ))}
    </div>
  )
}
