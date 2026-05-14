import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { getInitials } from '@/lib/pm/utils'
import type { FeedItem } from '@/lib/pm/types'

function relativeDueText(item: FeedItem): string | null {
  if (item.badge === 'overdue') {
    const d = item.daysOverdue ?? 0
    if (d === 0) return 'Vencía hoy'
    if (d === 1) return 'Vencía ayer'
    return `Vencía hace ${d} días`
  }
  if (item.badge === 'due') {
    const d = item.daysUntilDue ?? 0
    if (d === 0) return 'Vence hoy'
    if (d === 1) return 'Vence mañana'
    return `Vence en ${d} días`
  }
  if (item.badge === 'brief') return 'Onboarding sin completar'
  if (item.badge === 'report') return 'Brief sin reporte generado'
  return null
}

function badgeFor(item: FeedItem) {
  if (item.badge === 'overdue') {
    return <Badge variant="destructive">Vencida</Badge>
  }
  if (item.badge === 'due') {
    const d = item.daysUntilDue ?? 0
    const label = d === 0 ? 'Hoy' : d === 1 ? 'Mañana' : `${d} días`
    return <Badge variant="warning">{label}</Badge>
  }
  if (item.badge === 'brief') return <Badge variant="info">Brief</Badge>
  if (item.badge === 'report') return <Badge variant="info">Reporte</Badge>
  return null
}

interface FeedRowProps {
  item: FeedItem
}

export function FeedRow({ item }: FeedRowProps) {
  const meta = relativeDueText(item)

  return (
    <Link
      href={`/dashboard/pm/${item.clientId}`}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 transition-colors hover:border-primary/40 hover:bg-accent/30"
    >
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-[11px] font-bold text-muted-foreground"
      >
        {getInitials(item.clientName)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">
          <span className="font-semibold">{item.clientName}</span>
          <span className="text-muted-foreground"> · </span>
          {item.title}
        </p>
        {meta && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {meta}
            {item.sectionName ? <span className="mx-1.5 opacity-50">·</span> : null}
            {item.sectionName ?? ''}
            {item.priority ? (
              <>
                <span className="mx-1.5 opacity-50">·</span>
                Prioridad {item.priority}
              </>
            ) : null}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {badgeFor(item)}
        <span
          aria-hidden
          className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
        >
          ›
        </span>
      </div>
    </Link>
  )
}
