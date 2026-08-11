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
  variant = 'table',
}: Props) {
  const isCard = variant === 'card'

  const hover =
    'transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground'
  const primaryClass = isCard
    ? `h-11 flex-1 justify-center ${hover}`
    : `h-8 w-34 justify-center ${hover}`
  // `group` es obligatorio: las capas de la flecha reaccionan con group-hover.
  const iconClass = `group shrink-0 ${hover} ${isCard ? 'size-11' : 'size-8'}`

  return (
    <div className={isCard ? 'flex gap-2' : 'flex items-center gap-2'}>
      <Primary
        latest={latest}
        accountId={accountId}
        onGenerateFor={onGenerateFor}
        onRetry={onRetry}
        className={primaryClass}
      />
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
  className,
}: Pick<Props, 'latest' | 'accountId' | 'onGenerateFor' | 'onRetry'> & { className: string }) {
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
 */
function ViewButton({ report, className }: { report: Report; className: string }) {
  const label = `Ver el reporte de ${periodLabel(report.period_year, report.period_month)}`

  return (
    <Button asChild size="icon-sm" variant="outline" className={className}>
      <a href={report.report_url!} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
        <span className="relative block size-[15px] motion-reduce:[&_*]:!transform-none">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 size-[15px]">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </svg>
          {/* Sale */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 size-[15px] transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-[7px] group-hover:-translate-y-[7px] group-hover:opacity-0">
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
          </svg>
          {/* Entra */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 size-[15px] -translate-x-[7px] translate-y-[7px] opacity-0 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100">
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
          </svg>
        </span>
      </a>
    </Button>
  )
}
