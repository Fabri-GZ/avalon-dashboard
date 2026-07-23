import { getClientBadges, getIntencionBadge } from '@/lib/crm/registry'
import type { Lead } from '@/lib/crm/types'

// Shared across `LeadCard` (kanban, compact) and `LeadInfoPanel` (full
// detail): renders the intención badge (per-client override with a shared
// fallback, resolved via `getIntencionBadge` in the registry) plus whatever
// client-specific badges the registry produces for `lead.client_key` (e.g.
// FZ Motos' match de stock). Always renders the wrapping element -- even with
// zero badges -- so callers that rely on this slot for `justify-between`
// spacing (see `LeadCard`) don't need a separate placeholder.

export function LeadBadges({ lead }: { lead: Lead }) {
  const clientBadges = getClientBadges(lead.client_key, lead.details)
  const intencionBadge = getIntencionBadge(lead.client_key, lead.intencion)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {intencionBadge && (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${intencionBadge.className}`}
        >
          {intencionBadge.label}
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
