'use client'

import type { AccountRow, Report } from '@/lib/reportes/types'
import { periodLabel, generatedAt } from '@/lib/reportes/format'
import { ReportRowActions } from './ReportRowActions'
import { StatusBadge } from './StatusBadge'

interface Props extends AccountRow {
  onGenerateFor: (accountId: string) => void
  onRetry: (report: Report) => void
}

/**
 * One account as a card, for viewports below `sm`. Mirrors `TaskCard`'s
 * container classes so the two modules read as one system.
 *
 * Three rows: name + status, period + timestamp, actions. The action pair is
 * the same component the table uses — only the `card` variant differs, which
 * raises the controls to 44px so they clear the touch-target minimum the 32px
 * table variant does not need.
 */
export function ReportCard({ account, latest, lastDone, onGenerateFor, onRetry }: Props) {
  return (
    <li className="rounded-md border border-border bg-card px-4 py-3 shadow-sm transition-all duration-200 ease-in">
      <div className="flex items-start justify-between gap-3">
        {/* Same wrapping rule as the table: clip visually at two lines, never
            truncate with an ellipsis, and carry the full name in `title`. The
            text node stays intact, so screen readers still read all of it. */}
        <span
          className="line-clamp-2 break-words text-sm font-semibold text-foreground"
          title={account.name}
        >
          {account.name}
        </span>
        <span className="shrink-0">
          <StatusBadge status={latest?.status ?? 'none'} />
        </span>
      </div>

      <p className="mt-1.5 text-xs text-muted-foreground">
        {latest
          ? `${periodLabel(latest.period_year, latest.period_month)} · ${generatedAt(latest.created_at)}`
          : '—'}
      </p>

      <div className="mt-3">
        <ReportRowActions
          latest={latest}
          lastDone={lastDone}
          accountId={account.id}
          onGenerateFor={onGenerateFor}
          onRetry={onRetry}
          variant="card"
        />
      </div>
    </li>
  )
}
