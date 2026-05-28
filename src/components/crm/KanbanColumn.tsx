'use client'

import { useDroppable } from '@dnd-kit/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { LeadCard } from './LeadCard'
import type { Lead, Stage } from '@/lib/crm/types'

const STAGE_META: Record<Stage, { label: string; dot: string; ring: string }> = {
  nuevo: { label: 'Nuevo', dot: 'bg-sky-500', ring: 'border-sky-500/30' },
  conversando: { label: 'Conversando', dot: 'bg-amber-500', ring: 'border-amber-500/30' },
  derivado: { label: 'Derivado', dot: 'bg-violet-500', ring: 'border-violet-500/30' },
  cerrado: { label: 'Cerrado', dot: 'bg-emerald-500', ring: 'border-emerald-500/30' },
  sin_respuesta: { label: 'Sin respuesta', dot: 'bg-zinc-400', ring: 'border-zinc-400/30' },
}

export function KanbanColumn({
  stage,
  leads,
  isDragActive,
  draggedFromStage,
}: {
  stage: Stage
  leads: Lead[]
  isDragActive?: boolean
  draggedFromStage?: Stage | null
}) {
  const isProtected = stage === 'derivado'

  // derivado is NOT disabled — we want isDropTarget=true so we can show the blocked visual.
  // The derivado guard lives in KanbanBoard.onDragEnd.
  const { ref, isDropTarget } = useDroppable({ id: stage })

  const meta = STAGE_META[stage]
  const isValidHover = isDropTarget && !isProtected
  const isBlockedHover = isDropTarget && isProtected
  const showPlaceholder = isValidHover && draggedFromStage !== stage

  return (
    <div
      className={`flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/30 transition-all duration-200 ${
        isDragActive && !isDropTarget ? 'opacity-60' : 'opacity-100'
      } ${isValidHover ? 'ring-2 ring-primary/50 bg-primary/5' : ''} ${
        isBlockedHover ? 'ring-2 ring-destructive/40 bg-destructive/5' : ''
      }`}
    >
      <div className={`flex items-center gap-2 border-b px-3 py-2.5 ${meta.ring}`}>
        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
        <span className="text-sm font-semibold text-foreground">{meta.label}</span>
        {isProtected && (
          <Lock
            className={`h-3 w-3 transition-colors duration-150 ${
              isBlockedHover ? 'text-destructive/80' : 'text-muted-foreground/50'
            }`}
          />
        )}
        <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-xs font-bold tabular-nums text-foreground">
          {leads.length}
        </span>
      </div>

      <div ref={ref} className="flex flex-1 flex-col gap-2 overflow-y-auto p-2 scrollbar-themed">
        <AnimatePresence>
          {isBlockedHover ? (
            <motion.div
              key="blocked"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-center justify-center gap-2 px-3 py-8 text-center"
            >
              <Lock className="h-5 w-5 text-destructive/60" />
              <span className="text-xs leading-snug text-destructive/70">
                Utiliza &quot;Derivar Automáticamente&quot; para mover aquí
              </span>
            </motion.div>
          ) : leads.length === 0 && !showPlaceholder ? (
            <p key="empty" className="px-2 py-6 text-center text-xs text-muted-foreground/70">
              Sin leads
            </p>
          ) : (
            <>
              {leads.map((lead) => (
                <LeadCard key={lead.session_id} lead={lead} isDragActive={isDragActive} />
              ))}
              {showPlaceholder && (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.12, ease: [0.4, 0, 0.2, 1] }}
                  className="flex h-[88px] items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-primary/5"
                >
                  <span className="text-xs font-semibold text-primary/70">
                    Suelte el lead aquí
                  </span>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
