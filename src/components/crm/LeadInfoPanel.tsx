'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { User, MapPin, Package, Layers, GitBranch, UserCheck } from 'lucide-react'
import { toast } from 'react-toastify'
import { initials, prettify, prettifyLocation, capitalize } from '@/lib/crm/format'
import type { Lead, Stage } from '@/lib/crm/types'
import { STAGE_UPDATE_ERROR_MESSAGES } from '@/lib/crm/types'
import { updateStageAction } from '@/app/actions/crm-actions'
import { StageSelect } from './StageSelect'

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

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin
  label: string
  value: string | null
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
    </div>
  )
}

export function LeadInfoPanel({ lead }: { lead: Lead }) {
  const [currentStage, setCurrentStage] = useState<Stage>(lead.stage)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const avatar = initials(lead.nombre)
  const intencion = lead.intencion ? INTENCION_STYLE[lead.intencion] : null

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
        {intencion && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${intencion.className}`}
          >
            {intencion.label}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StageSelect
          value={currentStage}
          onChange={handleStageChange}
          isPending={isPending}
        />
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-4">
        <Field icon={MapPin} label="Ubicación" value={prettifyLocation(lead.ubicacion)} />
        <Field icon={Package} label="Material" value={prettify(lead.material)} />
        <Field icon={Layers} label="Aberturas" value={prettify(lead.cantidad_aberturas)} />
        <Field icon={Layers} label="Detalle" value={lead.detalle_aberturas} />
        {lead.derivado && (
          <Field
            icon={GitBranch}
            label="Derivación"
            value={capitalize(lead.tipo_derivacion) || 'Derivado'}
          />
        )}
        {lead.comercial_asignado && (
          <Field icon={UserCheck} label="Comercial" value={lead.comercial_asignado} />
        )}
      </div>
    </div>
  )
}
