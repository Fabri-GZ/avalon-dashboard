'use client'

import { useMemo, useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropProvider } from '@dnd-kit/react'
import { toast } from 'react-toastify'
import { CrmTopbar, type CrmFilters, type DateRange } from './CrmTopbar'
import { KanbanColumn } from './KanbanColumn'
import { updateStageAction } from '@/app/actions/crm-actions'
import type { Lead, Stage } from '@/lib/crm/types'
import { STAGE_UPDATE_ERROR_MESSAGES } from '@/lib/crm/types'

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
  const [localLeads, setLocalLeads] = useState<Lead[]>(leads)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const draggedFromStage = activeId
    ? (localLeads.find((l) => l.session_id === activeId)?.stage ?? null)
    : null

  useEffect(() => {
    setLocalLeads(leads)
  }, [leads])

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase()
    return localLeads.filter((lead) => {
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
  }, [localLeads, filters, now])

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

      <div className="min-w-0 overflow-hidden">
        <DragDropProvider
          onDragStart={(event) => {
            setActiveId(String(event.operation.source?.id ?? ''))
          }}
          onDragEnd={(event) => {
            const sourceId = String(event.operation.source?.id ?? '')
            const targetStage = event.operation.target?.id as Stage | undefined

            setActiveId(null)

            if (event.canceled || !sourceId || !targetStage) return

            if (targetStage === 'derivado') {
              toast.error(STAGE_UPDATE_ERROR_MESSAGES.protected_stage)
              return
            }

            const draggedLead = localLeads.find((l) => l.session_id === sourceId)
            if (!draggedLead || draggedLead.stage === targetStage) return

            const previousLeads = localLeads
            setLocalLeads((prev) =>
              prev.map((l) => (l.session_id === sourceId ? { ...l, stage: targetStage } : l)),
            )

            startTransition(async () => {
              const result = await updateStageAction(sourceId, targetStage)
              if (!result.success) {
                setLocalLeads(previousLeads)
                toast.error(STAGE_UPDATE_ERROR_MESSAGES[result.error ?? 'db_error'])
                return
              }
              toast.success(
                `Lead "${draggedLead.nombre ?? draggedLead.contacto ?? 'sin nombre'}" actualizado con éxito.`,
              )
              router.refresh()
            })
          }}
        >
          <div className="flex gap-4 overflow-x-auto pb-2">
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                leads={columns[stage]}
                isDragActive={!!activeId}
                draggedFromStage={draggedFromStage}
              />
            ))}
          </div>
        </DragDropProvider>
      </div>
    </div>
  )
}
