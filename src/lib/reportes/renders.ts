// Pure helpers over the renders embedded in the history rows. Shared by the
// row menu (which rows are sendable) and the send modal (which versions).

import type { Report, ReportRenderSummary } from './types'

/** Finished renders that actually have a URL, newest first. */
export function doneRenders(report: Report): ReportRenderSummary[] {
  return (report.report_renders ?? [])
    .filter((r) => r.status === 'done' && r.report_url)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export interface SendVersion {
  renderId: string
  version: number
  renderedAt: string
}

export interface SendContext {
  year: number
  month: number
  /** Complete versions of the period that have a finished render, newest first. */
  versions: SendVersion[]
  /** Deliveries already sent for the account+period, across all its versions. */
  priorSentCount: number
}

/**
 * What the send modal needs for one account: the period of its latest finished
 * render, the sendable versions of that period (each with its newest finished
 * render) and how many times the period was already sent.
 */
export function buildSendContext(
  reports: Report[],
  accountId: string,
  period: { year: number; month: number },
): SendContext {
  const sameScope = reports.filter(
    (r) =>
      r.report_type === 'complete' &&
      r.account_id === accountId &&
      r.period_year === period.year &&
      r.period_month === period.month,
  )

  const versions: SendVersion[] = sameScope
    .flatMap((r) => {
      const render = doneRenders(r)[0]
      return render ? [{ renderId: render.id, version: r.version, renderedAt: render.created_at }] : []
    })
    .sort((a, b) => b.version - a.version)

  const priorSentCount = sameScope.reduce(
    (total, r) =>
      total +
      (r.report_renders ?? []).reduce(
        (n, render) => n + (render.report_deliveries ?? []).filter((d) => d.status === 'sent').length,
        0,
      ),
    0,
  )

  return { year: period.year, month: period.month, versions, priorSentCount }
}
