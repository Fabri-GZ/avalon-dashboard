'use client'

import { LeadCard } from './LeadCard'
import type { Lead, Stage } from '@/lib/crm/types'

const STAGE_META: Record<Stage, { label: string; dot: string; ring: string }> = {
  nuevo: { label: 'Nuevo', dot: 'bg-sky-500', ring: 'border-sky-500/30' },
  conversando: { label: 'Conversando', dot: 'bg-amber-500', ring: 'border-amber-500/30' },
  derivado: { label: 'Derivado', dot: 'bg-violet-500', ring: 'border-violet-500/30' },
  cerrado: { label: 'Cerrado', dot: 'bg-emerald-500', ring: 'border-emerald-500/30' },
  sin_respuesta: { label: 'Sin respuesta', dot: 'bg-zinc-400', ring: 'border-zinc-400/30' },
}

export function KanbanColumn({ stage, leads }: { stage: Stage; leads: Lead[] }) {
  const meta = STAGE_META[stage]

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/30">
      <div className={`flex items-center gap-2 border-b px-3 py-2.5 ${meta.ring}`}>
        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
        <span className="text-sm font-semibold text-foreground">{meta.label}</span>
        <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-xs font-bold tabular-nums text-foreground">
          {leads.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2 scrollbar-themed">
        {leads.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground/70">
            Sin leads
          </p>
        ) : (
          leads.map((lead) => <LeadCard key={lead.session_id} lead={lead} />)
        )}
      </div>
    </div>
  )
}
