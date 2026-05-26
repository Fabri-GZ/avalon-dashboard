'use client'

import { useMemo, useState } from 'react'
import { CrmTopbar, type CrmFilters, type DateRange } from './CrmTopbar'
import { KanbanColumn } from './KanbanColumn'
import type { Lead, Stage } from '@/lib/crm/types'

const STAGES: Stage[] = ['nuevo', 'conversando', 'derivado', 'cerrado', 'sin_respuesta']

const RANGE_MS: Record<Exclude<DateRange, 'todo'>, number> = {
  hoy: 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
}

const INITIAL_FILTERS: CrmFilters = {
  search: '',
  channel: 'whatsapp',
  dateRange: 'todo',
}

export function KanbanBoard({ leads }: { leads: Lead[] }) {
  const [filters, setFilters] = useState<CrmFilters>(INITIAL_FILTERS)
  const [now] = useState(() => Date.now())

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase()

    return leads.filter((lead) => {
      if (term) {
        const haystack = `${lead.nombre ?? ''} ${lead.contacto ?? ''}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }

      if (filters.dateRange !== 'todo') {
        if (!lead.last_message_at) return false
        const ts = new Date(lead.last_message_at).getTime()
        if (Number.isNaN(ts) || now - ts > RANGE_MS[filters.dateRange]) return false
      }

      return true
    })
  }, [leads, filters, now])

  const columns = useMemo(() => {
    const map: Record<Stage, Lead[]> = {
      nuevo: [],
      conversando: [],
      derivado: [],
      cerrado: [],
      sin_respuesta: [],
    }
    for (const lead of filtered) {
      if (map[lead.stage]) map[lead.stage].push(lead)
    }
    return map
  }, [filtered])

  return (
    <div className="flex flex-col gap-4">
      <CrmTopbar value={filters} onChange={setFilters} total={filtered.length} />

      <div className="flex gap-4 overflow-x-auto pb-2">
        {STAGES.map((stage) => (
          <KanbanColumn key={stage} stage={stage} leads={columns[stage]} />
        ))}
      </div>
    </div>
  )
}
