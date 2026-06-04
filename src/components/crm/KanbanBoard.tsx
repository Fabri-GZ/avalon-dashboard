'use client'

import { useMemo, useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropProvider } from '@dnd-kit/react'
import { toast } from 'react-toastify'
import { CrmTopbar } from './CrmTopbar'
import { KanbanColumn } from './KanbanColumn'
import { updateStageAction } from '@/app/actions/crm-actions'
import type { Channel, CrmDateRange, Lead, Stage } from '@/lib/crm/types'
import { STAGE_UPDATE_ERROR_MESSAGES } from '@/lib/crm/types'

const STAGES: Stage[] = ['nuevo', 'conversando', 'derivado', 'cerrado', 'sin_respuesta']

interface CrmFilters {
  search: string
  channel: Channel
}

const INITIAL_FILTERS: CrmFilters = {
  search: '',
  channel: 'whatsapp',
}

interface KanbanBoardProps {
  leads: Lead[]
  initialDateRange: CrmDateRange
}

export function KanbanBoard({ leads, initialDateRange }: KanbanBoardProps) {
  const [filters, setFilters] = useState<CrmFilters>(INITIAL_FILTERS)
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
    if (!term) return localLeads
    return localLeads.filter((lead) => {
      const haystack = `${lead.nombre ?? ''} ${lead.contacto ?? ''}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [localLeads, filters.search])

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
      <CrmTopbar
        search={filters.search}
        onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
        initialDateRange={initialDateRange}
        total={filtered.length}
      />

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
