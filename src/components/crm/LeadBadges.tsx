import { getClientBadges } from '@/lib/crm/registry'
import type { Lead } from '@/lib/crm/types'

// Shared across `LeadCard` (kanban, compact) and `LeadInfoPanel` (full
// detail): renders the intención badge (shared vocabulary, every client) plus
// whatever client-specific badges the registry produces for `lead.client_key`
// (e.g. FZ Motos' moto de interés / match de stock). Always renders the
// wrapping element -- even with zero badges -- so callers that rely on this
// slot for `justify-between` spacing (see `LeadCard`) don't need a separate
// placeholder.
const INTENCION_STYLE: Record<string, { label: string; className: string }> = {
  presupuesto: {
    label: 'Presupuesto',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  },
  postventa: {
    label: 'Postventa',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
  },
  otro: {
    label: 'Otro',
    className: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300',
  },
}

export function LeadBadges({ lead }: { lead: Lead }) {
  const clientBadges = getClientBadges(lead.client_key, lead.details)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {lead.intencion && (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            INTENCION_STYLE[lead.intencion]?.className ?? 'bg-muted text-muted-foreground'
          }`}
        >
          {INTENCION_STYLE[lead.intencion]?.label ?? lead.intencion}
        </span>
      )}
      {clientBadges.map((badge) => (
        <span
          key={badge.key}
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  )
}
