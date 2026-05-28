'use client'

import { Lock, ChevronDown, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Stage } from '@/lib/crm/types'
import { SELECTABLE_STAGES } from '@/lib/crm/types'

const STAGE_META: Record<
  Stage,
  {
    label: string
    dot: string
    badge: string
    chevron: string
    text: string
    rowTint: string
    rowTintHover: string
    description: string
  }
> = {
  nuevo: {
    label: 'Nuevo',
    dot: 'bg-sky-500',
    badge: 'bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300',
    chevron: 'text-sky-700/70 dark:text-sky-300/70',
    text: 'text-sky-700 dark:text-sky-300',
    rowTint: 'bg-sky-500/10',
    rowTintHover: 'focus:bg-sky-500/15 focus:text-sky-700 dark:focus:text-sky-300',
    description: 'Lead recién ingresado, aún sin contacto',
  },
  conversando: {
    label: 'Conversando',
    dot: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
    chevron: 'text-amber-700/70 dark:text-amber-300/70',
    text: 'text-amber-700 dark:text-amber-300',
    rowTint: 'bg-amber-500/10',
    rowTintHover: 'focus:bg-amber-500/15 focus:text-amber-700 dark:focus:text-amber-300',
    description: 'En conversación activa por el chatbot',
  },
  derivado: {
    label: 'Derivado',
    dot: 'bg-violet-500',
    badge: 'bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300',
    chevron: 'text-violet-700/70 dark:text-violet-300/70',
    text: 'text-violet-700 dark:text-violet-300',
    rowTint: 'bg-violet-500/10',
    rowTintHover: 'focus:bg-violet-500/15 focus:text-violet-700 dark:focus:text-violet-300',
    description: 'Solo vía "Derivar Automáticamente"',
  },
  cerrado: {
    label: 'Cerrado',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
    chevron: 'text-emerald-700/70 dark:text-emerald-300/70',
    text: 'text-emerald-700 dark:text-emerald-300',
    rowTint: 'bg-emerald-500/10',
    rowTintHover: 'focus:bg-emerald-500/15 focus:text-emerald-700 dark:focus:text-emerald-300',
    description: 'Lead concretado',
  },
  sin_respuesta: {
    label: 'Sin respuesta',
    dot: 'bg-zinc-400',
    badge: 'bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-400',
    chevron: 'text-zinc-600/70 dark:text-zinc-400/70',
    text: 'text-zinc-600 dark:text-zinc-400',
    rowTint: 'bg-zinc-500/10',
    rowTintHover: 'focus:bg-zinc-500/15 focus:text-zinc-600 dark:focus:text-zinc-400',
    description: 'Sin respuesta del lead',
  },
}

interface StageSelectProps {
  value: Stage
  onChange: (next: Stage) => void
  disabled?: boolean
  isPending?: boolean
}

export function StageSelect({ value, onChange, disabled, isPending }: StageSelectProps) {
  const isLocked = value === 'derivado' || disabled || isPending
  const meta = STAGE_META[value]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isLocked}
        aria-label="Cambiar stage"
        className={`inline-flex h-auto w-fit items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold ring-1 outline-none transition-opacity focus-visible:ring-2 ${meta.badge} ${
          isLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:opacity-90'
        }`}
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
        <span>{meta.label}</span>
        {isLocked ? (
          <Lock className={`h-3 w-3 ${meta.chevron}`} />
        ) : (
          <ChevronDown className={`h-3.5 w-3.5 ${meta.chevron}`} />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[260px] p-1">
        {SELECTABLE_STAGES.map((stage) => {
          const m = STAGE_META[stage]
          const isActive = stage === value
          return (
            <DropdownMenuItem
              key={stage}
              onSelect={() => onChange(stage)}
              className={`flex items-start gap-2.5 rounded-md px-2.5 py-2 transition-colors duration-200 ease-in ${m.rowTintHover} ${
                isActive ? m.rowTint : ''
              }`}
            >
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${m.dot}`} />
              <div className="flex-1 leading-tight">
                <div
                  className={`text-sm ${
                    isActive ? `font-semibold ${m.text}` : 'font-medium text-foreground'
                  }`}
                >
                  {m.label}
                </div>
                <div className="text-[11px] text-muted-foreground">{m.description}</div>
              </div>
              {isActive && <Check className={`mt-0.5 h-4 w-4 shrink-0 ${m.text}`} />}
            </DropdownMenuItem>
          )
        })}

        <div className="my-1 h-px bg-border/60" />

        <DropdownMenuItem
          disabled
          className="flex items-start gap-2.5 rounded-md px-2.5 py-2 opacity-50"
        >
          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${STAGE_META.derivado.dot}`} />
          <div className="flex-1 leading-tight">
            <div className="text-sm font-medium text-foreground">{STAGE_META.derivado.label}</div>
            <div className="text-[11px] text-muted-foreground">
              {STAGE_META.derivado.description}
            </div>
          </div>
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
