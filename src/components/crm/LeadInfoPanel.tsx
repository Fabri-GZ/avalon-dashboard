'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LuUser as User } from 'react-icons/lu'
import { toast } from 'react-toastify'
import { initials } from '@/lib/crm/format'
import type { Lead, Stage } from '@/lib/crm/types'
import { STAGE_UPDATE_ERROR_MESSAGES } from '@/lib/crm/types'
import { updateStageAction } from '@/app/actions/crm-actions'
import { StageSelect } from './StageSelect'
import { LeadBadges } from './LeadBadges'
import { LeadDetailsFields } from './LeadDetailsFields'

export function LeadInfoPanel({ lead }: { lead: Lead }) {
  const [currentStage, setCurrentStage] = useState<Stage>(lead.stage)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const avatar = initials(lead.nombre)

  function handleStageChange(newStage: Stage) {
    if (newStage === 'derivado') return

    const previous = currentStage
    setCurrentStage(newStage)

    startTransition(async () => {
      const result = await updateStageAction(lead.session_id, newStage)
      if (!result.success) {
        setCurrentStage(previous)
        toast.error(STAGE_UPDATE_ERROR_MESSAGES[result.error ?? 'db_error'])
        return
      }
      toast.success(`Lead "${lead.nombre ?? lead.contacto ?? 'sin nombre'}" actualizado con éxito.`)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
          {avatar === '?' ? <User className="h-5 w-5" /> : avatar}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-foreground">
            {lead.nombre ?? 'Sin nombre'}
          </p>
          {lead.contacto && (
            <p className="truncate text-sm text-muted-foreground">{lead.contacto}</p>
          )}
        </div>
        <div className="shrink-0">
          <LeadBadges lead={lead} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StageSelect
          value={currentStage}
          onChange={handleStageChange}
          isPending={isPending}
        />
      </div>

      <LeadDetailsFields lead={lead} />
    </div>
  )
}
