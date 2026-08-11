'use client'

import { LuLoader, LuPlus, LuRotateCw } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import type { Report } from '@/lib/reportes/types'
import { periodLabel } from '@/lib/reportes/format'

interface Props {
  latest: Report | null
  lastDone: Report | null
  accountId: string
  onGenerateFor: (accountId: string) => void
  onRetry: (report: Report) => void
  /**
   * A report is generating somewhere in the section. Only one job runs at a
   * time, so every primary control goes inert — not just this row's.
   */
  busy?: boolean
  /** Cards on mobile need 44px targets and a full-width primary. */
  variant?: 'table' | 'card'
}

/**
 * The action pair for one account row: the primary control on the left
 * (Generar / Reintentar / a disabled En curso) and, to its right, a compact
 * icon-only button that opens the last readable report.
 *
 * The icon slot is ALWAYS reserved, even when there is nothing to open. An
 * empty placeholder keeps every primary control aligned in one column, so the
 * action area never shifts as rows change status between refreshes.
 */
export function ReportRowActions({
  latest,
  lastDone,
  accountId,
  onGenerateFor,
  onRetry,
  busy = false,
  variant = 'table',
}: Props) {
  const isCard = variant === 'card'

  // Acá vivía un override del hover, porque el `outline` de shadcn cambiaba el
  // color del texto contra un token invertido. Eso ahora lo resuelve la propia
  // variante `outline` en `components/ui/button.tsx`, así que estas clases solo
  // definen tamaño: el hover se hereda y hay una sola fuente de verdad.
  const primaryClass = isCard ? 'h-11 flex-1 justify-center' : 'h-8 w-34 justify-center'
  // `group` es obligatorio: las capas de la flecha reaccionan con group-hover.
  const iconClass = `group shrink-0 ${isCard ? 'size-11' : 'size-8'}`

  return (
    <div className={isCard ? 'flex gap-2' : 'flex items-center gap-2'}>
      <Primary
        latest={latest}
        accountId={accountId}
        onGenerateFor={onGenerateFor}
        onRetry={onRetry}
        busy={busy}
        className={primaryClass}
      />
      {/* El botón de ver NO se deshabilita con `busy`: abre un reporte ya
          terminado en otra pestaña, no toca el job en curso. Deshabilitarlo
          sacaría el único acceso al reporte anterior justo durante el minuto
          y medio en que el usuario espera el reemplazo. */}
      {lastDone ? (
        <ViewButton report={lastDone} className={iconClass} />
      ) : (
        // Reserved, not omitted: keeps the primary controls aligned.
        <span aria-hidden className={isCard ? 'size-11 shrink-0' : 'size-8 shrink-0'} />
      )}
    </div>
  )
}

function Primary({
  latest,
  accountId,
  onGenerateFor,
  onRetry,
  busy,
  className,
}: Pick<Props, 'latest' | 'accountId' | 'onGenerateFor' | 'onRetry'> & {
  busy: boolean
  className: string
}) {
  if (latest?.status === 'pending' || latest?.status === 'running') {
    return (
      <Button size="sm" variant="outline" className={className} disabled>
        <LuLoader className="animate-spin" /> En curso
      </Button>
    )
  }

  if (latest?.status === 'error') {
    return (
      <Button
        size="sm"
        variant="outline"
        className={`${className} [&:hover_svg]:rotate-180 [&_svg]:transition-transform`}
        onClick={() => onRetry(latest)}
        disabled={busy}
      >
        <LuRotateCw /> Reintentar
      </Button>
    )
  }

  // Everything else generates: no report yet, or one already finished and the
  // next period is what the user wants. This is the case the section was
  // missing — a finished row used to offer no way to generate again.
  return (
    <Button
      size="sm"
      variant="outline"
      className={`${className} [&:hover_svg]:rotate-90 [&:hover_svg]:scale-110 [&_svg]:transition-transform`}
      onClick={() => onGenerateFor(accountId)}
      disabled={busy}
    >
      <LuPlus /> Generar
    </Button>
  )
}

/**
 * Icon-only, so it carries its accessible name through `aria-label`. The label
 * names the period on purpose: while a new report generates, the row's period
 * column shows the period being generated, not the one this button opens.
 * A generic "Ver reporte" would let the user click expecting the wrong month.
 *
 * The glyph is split into layers so only the arrow moves on hover: the box is
 * the frame you are leaving, and it has to stay put. Animating the whole glyph
 * flies the box away with the arrow, which contradicts what the icon means.
 *
 * Motion, and why the two properties are timed apart:
 *
 * Opacity runs at 200ms while transform runs at 380ms — deliberately, not by
 * accident. A single shared duration makes both arrows sit at ~50% opacity in
 * different positions through the middle of the transition, so you see two
 * ghosts crossing and it reads as a stutter. Fading nearly twice as fast means
 * the outgoing arrow is gone well before it finishes travelling, and the
 * incoming one has arrived before it becomes fully visible. Only one arrow is
 * ever really legible at a time.
 *
 * The easing carries no overshoot either. cubic-bezier(0.34, 1.56, 0.64, 1)
 * works on a hero button, but here the travel is 7px inside a 15px glyph, so
 * the overshoot is about a pixel: too small to read as a bounce, big enough to
 * read as a glitch.
 */
// Las dos duraciones van en `style` inline y no en una clase arbitraria de
// Tailwind: un valor con comas anidadas dentro de `cubic-bezier()` depende de
// cómo lo parsee el generador, y si no emite la clase no queda transición
// ninguna — las flechas saltarían de golpe, que es peor que el bug original.
// Acá el valor es literal y no depende de nadie. `StatusBadge` ya usa `style`
// por la misma razón con `color-mix`.
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'

const ARROW_MOTION = {
  // `translate` va primero y NO es opcional. Tailwind v4 dejó de componer
  // `transform` para las utilidades de traslación: `translate-x-[7px]` emite
  // `translate: var(--tw-translate-x) var(--tw-translate-y)`, la propiedad CSS
  // individual. Una transición sobre `transform` apunta entonces a algo que
  // nunca cambia — la opacidad interpolaba y la posición saltaba de golpe, que
  // es exactamente el tirón que se veía. El panel de Animations lo mostró sin
  // lugar a dudas: solo había tracks de `opacity`, ninguno de posición.
  // `transform` queda listado por si alguna utilidad futura vuelve a usarlo.
  transition: `translate 380ms ${EASE_OUT}, transform 380ms ${EASE_OUT}, opacity 200ms ease-out`,
} as const

function ViewButton({ report, className }: { report: Report; className: string }) {
  const label = `Ver el reporte de ${periodLabel(report.period_year, report.period_month)}`

  return (
    <Button asChild size="icon-sm" variant="outline" className={className}>
      <a href={report.report_url!} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
        <span className="relative block size-[15px] motion-reduce:[&_*]:!translate-none motion-reduce:[&_*]:!transition-none">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 size-[15px]">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </svg>
          {/* Sale */}
          <svg style={ARROW_MOTION} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 size-[15px] group-hover:translate-x-[7px] group-hover:-translate-y-[7px] group-hover:opacity-0">
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
          </svg>
          {/* Entra */}
          <svg style={ARROW_MOTION} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 size-[15px] -translate-x-[7px] translate-y-[7px] opacity-0 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100">
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
          </svg>
        </span>
      </a>
    </Button>
  )
}
