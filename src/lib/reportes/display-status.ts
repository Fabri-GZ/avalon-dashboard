// Badge state of a history row. A complete report stays `draft_ready` in the DB
// forever (D7: render/send state lives on child rows), so its progress past the
// draft is derived here from the embedded renders and deliveries.

import { doneRenders } from './renders'
import type { Report, ReportDisplayStatus } from './types'

/**
 * `sent` if any render was delivered, else `done` if any render finished, else
 * the DB status. Render/delivery errors never change the badge, and rows without
 * the embedded renders (polling, optimistic inserts) fall back to the DB status.
 */
export function displayStatus(report: Report): ReportDisplayStatus {
  if (report.report_type !== 'complete') return report.status
  const renders = report.report_renders ?? []
  if (renders.some((r) => (r.report_deliveries ?? []).some((d) => d.status === 'sent'))) return 'sent'
  // Same "finished" rule as the row menu: a done render without a URL is not ready.
  if (doneRenders(report).length > 0) return 'done'
  return report.status
}
