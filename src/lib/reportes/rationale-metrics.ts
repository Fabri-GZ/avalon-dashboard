// Headline metrics shown next to the AI rationale. Deterministic: computed from
// `reports.report_data` (the compute step's output), never from the LLM.

export type DeltaTone = 'success' | 'danger' | 'neutral'

export interface RationaleMetric {
  key: 'spend' | 'conversions' | 'cost'
  label: string
  /** Display string of the current month, as formatted by the compute step. */
  value: string
  /** Absolute percent change vs the previous month, rounded, e.g. "17%". */
  delta: string
  direction: 'up' | 'down' | 'flat'
  tone: DeltaTone
}

interface MonthlyRow {
  spend?: unknown
  conversions?: unknown
  costPerConversion?: unknown
  formatted?: { spend?: string; conversions?: string; costPerConversion?: string }
}

interface ReportDataShape {
  mode?: string
  primaryConversion?: { label?: string; cpaLabel?: string; mode?: string }
  monthly?: MonthlyRow[]
}

type Better = 'higher' | 'lower' | 'neutral'

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

// The sign is carried by `direction` (the pill's triangle), so the text is unsigned.
function formatDelta(current: number, previous: number): string {
  return `${Math.round(Math.abs(((current - previous) / previous) * 100))}%`
}

/** `neutral` metrics (spend) are never judged good or bad. */
function toneFor(current: number, previous: number, better: Better): DeltaTone {
  if (better === 'neutral' || current === previous) return 'neutral'
  return (better === 'higher') === current > previous ? 'success' : 'danger'
}

/**
 * Report month vs previous month for spend, primary conversion and its cost.
 * A metric is dropped when the previous month is missing or zero (no base for a
 * percent change); returns [] when `reportData` has no usable monthly rows.
 */
export function getRationaleMetrics(reportData: unknown): RationaleMetric[] {
  if (!reportData || typeof reportData !== 'object') return []
  const data = reportData as ReportDataShape
  const rows = Array.isArray(data.monthly) ? data.monthly : []
  if (rows.length < 2) return []
  const cur = rows[rows.length - 1]
  const prev = rows[rows.length - 2]
  const awareness = data.mode === 'awareness' || data.primaryConversion?.mode === 'awareness'

  const defs: {
    key: RationaleMetric['key']
    label: string
    current: unknown
    previous: unknown
    shown: string | undefined
    better: Better
  }[] = [
    {
      key: 'spend',
      label: 'Inversión',
      current: cur.spend,
      previous: prev.spend,
      shown: cur.formatted?.spend,
      better: 'neutral',
    },
  ]
  // Awareness accounts have no conversion or cost per conversion to compare.
  if (!awareness) {
    defs.push(
      {
        key: 'conversions',
        label: data.primaryConversion?.label || 'Conversiones',
        current: cur.conversions,
        previous: prev.conversions,
        shown: cur.formatted?.conversions,
        better: 'higher',
      },
      {
        key: 'cost',
        label: data.primaryConversion?.cpaLabel || 'Costo/Conv.',
        current: cur.costPerConversion,
        previous: prev.costPerConversion,
        shown: cur.formatted?.costPerConversion,
        better: 'lower',
      },
    )
  }

  const metrics: RationaleMetric[] = []
  for (const d of defs) {
    const c = num(d.current)
    const p = num(d.previous)
    if (c === null || p === null || p === 0 || !d.shown) continue
    metrics.push({
      key: d.key,
      label: d.label,
      value: d.shown,
      delta: formatDelta(c, p),
      direction: c > p ? 'up' : c < p ? 'down' : 'flat',
      tone: toneFor(c, p, d.better),
    })
  }
  return metrics
}
