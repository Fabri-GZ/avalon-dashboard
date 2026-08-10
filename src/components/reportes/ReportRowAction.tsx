'use client'

import { LuExternalLink, LuLoader, LuPlus, LuRotateCw } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import type { Report } from '@/lib/reportes/types'

// Every variant shares this minimum width so the action column keeps the same
// size on every row. Sized on the longest label ("Reintentar"): without it, a
// row rendering a shorter label shrinks the column and shifts the layout as
// statuses change between refreshes.
const SHARED_WIDTH = 'min-w-[8.5rem]'

interface Props {
  latest: Report | null
  accountId: string
  onGenerateFor: (accountId: string) => void
  onRetry: (report: Report) => void
  /** Cards on mobile render the control across the row to clear the 44px touch target. */
  fullWidth?: boolean
}

/**
 * The single action control for one account row: Ver / Reintentar / Generar,
 * or a disabled "En curso" while a job is in flight.
 *
 * Every state returns a control — never bare text. An in-flight row used to
 * render a plain <span>, which read as a label rather than an unavailable
 * action and made the column width jump.
 */
export function ReportRowAction({
  latest,
  accountId,
  onGenerateFor,
  onRetry,
  fullWidth = false,
}: Props) {
  const className = `justify-center hover:bg-secondary hover:text-foreground ${
    fullWidth ? 'w-full' : SHARED_WIDTH
  }`

  if (latest?.status === 'pending' || latest?.status === 'running') {
    return (
      <Button size="sm" variant="outline" className={className} disabled>
        <LuLoader className="animate-spin" /> En curso
      </Button>
    )
  }

  if (latest?.status === 'done' && latest.report_url) {
    return (
      <Button asChild size="sm" variant="outline" className={className}>
        <a href={latest.report_url} target="_blank" rel="noopener noreferrer">
          <LuExternalLink /> Ver
        </a>
      </Button>
    )
  }

  if (latest?.status === 'error') {
    return (
      <Button
        size="sm"
        variant="outline"
        className={className}
        onClick={() => onRetry(latest)}
      >
        <LuRotateCw /> Reintentar
      </Button>
    )
  }

  // No report yet, or a "done" row whose report_url never landed. The second
  // case previously rendered an empty cell, leaving the row with no way out.
  return (
    <Button
      size="sm"
      variant="outline"
      className={className}
      onClick={() => onGenerateFor(accountId)}
    >
      <LuPlus /> Generar
    </Button>
  )
}
