'use client'

import { User, MapPin, Package, Layers, GitBranch, UserCheck } from 'lucide-react'
import { initials, prettify, prettifyLocation, capitalize } from '@/lib/crm/format'
import type { Lead, Stage } from '@/lib/crm/types'

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

const STAGE_STYLE: Record<Stage, { label: string; dot: string; badge: string }> = {
  nuevo: {
    label: 'Nuevo',
    dot: 'bg-sky-500',
    badge: 'bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300',
  },
  conversando: {
    label: 'Conversando',
    dot: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
  },
  derivado: {
    label: 'Derivado',
    dot: 'bg-violet-500',
    badge: 'bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300',
  },
  cerrado: {
    label: 'Cerrado',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
  },
  sin_respuesta: {
    label: 'Sin respuesta',
    dot: 'bg-zinc-400',
    badge: 'bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-400',
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
  const avatar = initials(lead.nombre)
  const intencion = lead.intencion ? INTENCION_STYLE[lead.intencion] : null
  const stageMeta = STAGE_STYLE[lead.stage]

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
          {avatar === '?' ? <User className="h-5 w-5" /> : avatar}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-foreground">
            {lead.nombre ?? 'Sin nombre'}
          </p>
          {lead.contacto && (
            <p className="truncate text-sm text-muted-foreground">{lead.contacto}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${stageMeta.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${stageMeta.dot}`} />
          {stageMeta.label}
        </span>

        {intencion && (
          <span
            className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${intencion.className}`}
          >
            {intencion.label}
          </span>
        )}
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
