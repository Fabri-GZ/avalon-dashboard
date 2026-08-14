'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropProvider } from '@dnd-kit/react'
import { toast } from 'react-toastify'
import { CrmTopbar } from './CrmTopbar'
import { KanbanColumn } from './KanbanColumn'
import { updateStageAction } from '@/app/actions/crm-actions'
import { useCrmParams } from '@/hooks/useCrmParams'
import type { LeadsColumnResult } from '@/lib/crm/queries'
import type { CrmDateRange, Lead, Stage } from '@/lib/crm/types'
import { STAGE_UPDATE_ERROR_MESSAGES } from '@/lib/crm/types'

const STAGES: Stage[] = ['conversando', 'derivado', 'cerrado']

interface KanbanBoardProps {
  columns: Record<Stage, LeadsColumnResult>
  counts: Record<Stage, number>
  initialDateRange: CrmDateRange
  initialQuery: string
  /** Server-resolved client id, forwarded down to each lead link so opening a
   * conversation stays inside the client the board is showing. */
  clientId?: string | null
}

// A lead confirmed-moved to a new stage, retained past its server-fetched
// window (see design D6 / `leadsForStage` below).
interface PinnedLead {
  lead: Lead
  stage: Stage
}

// The optimistic move while `updateStageAction` is in flight, before the
// server confirms and it becomes a `PinnedLead`.
interface PendingMove {
  sessionId: string
  from: Stage
  to: Stage
  lead: Lead
}

export function KanbanBoard({
  columns,
  counts,
  initialDateRange,
  initialQuery,
  clientId,
}: KanbanBoardProps) {
  const [localCounts, setLocalCounts] = useState(counts)
  const [pinned, setPinned] = useState<Record<string, PinnedLead>>({})
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const { setQuery, loadMore } = useCrmParams()

  useEffect(() => {
    setLocalCounts(counts)
  }, [counts])

  // A new search term or date range is a deliberate new view (design D6:
  // pinned retention lasts "hasta la próxima navegación") -- a lead pinned
  // under the old filters has no meaning under the new ones.
  useEffect(() => {
    setPinned({})
  }, [initialQuery, initialDateRange])

  // Derived, not stored: merges the server's paginated window for a stage
  // with any pinned leads that fell outside it, plus the in-flight optimistic
  // move if one is pending. Recomputing this on every render (instead of
  // syncing copies into state) means there is exactly one source of truth
  // (`columns` prop + `pinned` + `pendingMove`) and nothing can drift.
  function leadsForStage(stage: Stage): Lead[] {
    const serverLeads = columns[stage].leads
    const serverIds = new Set(serverLeads.map((l) => l.session_id))
    const pinnedExtra = Object.values(pinned)
      .filter((p) => p.stage === stage && !serverIds.has(p.lead.session_id))
      .map((p) => p.lead)

    let leads = [...pinnedExtra, ...serverLeads]

    if (pendingMove) {
      if (stage === pendingMove.from) {
        leads = leads.filter((l) => l.session_id !== pendingMove.sessionId)
      }
      if (stage === pendingMove.to && !leads.some((l) => l.session_id === pendingMove.sessionId)) {
        leads = [pendingMove.lead, ...leads]
      }
    }

    return leads
  }

  const columnsView: Record<Stage, Lead[]> = {
    conversando: leadsForStage('conversando'),
    derivado: leadsForStage('derivado'),
    cerrado: leadsForStage('cerrado'),
  }

  const draggedFromStage = activeId
    ? (STAGES.flatMap((s) => columnsView[s]).find((l) => l.session_id === activeId)?.stage ?? null)
    : null

  const total = STAGES.reduce((sum, s) => sum + localCounts[s], 0)

  return (
    <div className="flex flex-col gap-4">
      <CrmTopbar
        search={initialQuery}
        onSearchChange={setQuery}
        initialDateRange={initialDateRange}
        total={total}
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

            const draggedLead = STAGES.flatMap((s) => columnsView[s]).find(
              (l) => l.session_id === sourceId,
            )
            if (!draggedLead || draggedLead.stage === targetStage) return

            const sourceStage = draggedLead.stage

            setLocalCounts((prev) => ({
              ...prev,
              [sourceStage]: Math.max(0, prev[sourceStage] - 1),
              [targetStage]: prev[targetStage] + 1,
            }))
            setPendingMove({
              sessionId: sourceId,
              from: sourceStage,
              to: targetStage,
              lead: { ...draggedLead, stage: targetStage },
            })

            startTransition(async () => {
              const result = await updateStageAction(sourceId, targetStage)
              if (!result.success) {
                setLocalCounts((prev) => ({
                  ...prev,
                  [sourceStage]: prev[sourceStage] + 1,
                  [targetStage]: Math.max(0, prev[targetStage] - 1),
                }))
                setPendingMove(null)
                toast.error(STAGE_UPDATE_ERROR_MESSAGES[result.error ?? 'db_error'])
                return
              }
              setPinned((prev) => ({
                ...prev,
                [sourceId]: { lead: { ...draggedLead, stage: targetStage }, stage: targetStage },
              }))
              setPendingMove(null)
              toast.success(
                `Lead "${draggedLead.nombre ?? draggedLead.contacto ?? 'sin nombre'}" actualizado con éxito.`,
              )
              router.refresh()
            })
          }}
        >
          {/* justify-center-safe, not justify-center: centering a scroll
              container makes its overflow spill to both sides, and browsers
              won't scroll past the start edge -- the first column becomes
              unreachable as soon as the three don't fit. `safe` centers when
              there is room and falls back to start alignment when there isn't. */}
          <div className="flex gap-4 overflow-x-auto justify-center-safe pb-2">
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                leads={columnsView[stage]}
                clientId={clientId}
                total={localCounts[stage]}
                hasMore={columns[stage].hasMore}
                onLoadMore={() => loadMore(stage)}
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
