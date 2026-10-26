// Pure helpers over the renders embedded in the history rows.

import type { Report, ReportRenderSummary } from './types'

/** Finished renders that actually have a URL, newest first. */
export function doneRenders(report: Report): ReportRenderSummary[] {
  return (report.report_renders ?? [])
    .filter((r) => r.status === 'done' && r.report_url)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}
