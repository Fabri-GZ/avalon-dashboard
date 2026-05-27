import type { Period, InsightsPeriod, InsightsRange, TimeSeriesPoint } from './types'

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function subDays(date: Date, n: number): Date {
  return new Date(date.getTime() - n * 86400000)
}

function subMonths(date: Date, n: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() - n)
  return d
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const RANGE_BUCKET: Record<InsightsRange, InsightsPeriod['bucket']> = {
  hoy: 'hour',
  '7d': 'day',
  '30d': 'week',
  todo: 'month',
}

// Arranque del histórico para 'todo' — el chatbot de Grupo Norte no tiene datos antes de esto.
const HISTORY_START = new Date('2024-01-01T00:00:00.000Z')

export function getPeriodRange(range: InsightsRange): Period {
  const now = new Date()
  if (range === 'hoy') return { from: startOfDay(now), to: endOfDay(now) }
  if (range === '7d') return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) }
  if (range === '30d') return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) }
  return { from: HISTORY_START, to: endOfDay(now) }
}

export function getPreviousPeriodRange(range: InsightsRange): Period {
  const current = getPeriodRange(range)
  const dayBefore = endOfDay(subDays(current.from, 1))
  if (range === 'hoy') return { from: startOfDay(subDays(current.from, 1)), to: dayBefore }
  if (range === '7d') return { from: startOfDay(subDays(current.from, 7)), to: dayBefore }
  if (range === '30d') return { from: startOfDay(subDays(current.from, 30)), to: dayBefore }
  // 'todo' no tiene período anterior con sentido
  return { from: current.from, to: current.from }
}

export function buildInsightsPeriod(range: InsightsRange): InsightsPeriod {
  const current = getPeriodRange(range)
  const prev = getPreviousPeriodRange(range)
  return {
    from: current.from.toISOString(),
    to: current.to.toISOString(),
    prevFrom: prev.from.toISOString(),
    prevTo: prev.to.toISOString(),
    hasComparison: range !== 'todo',
    bucket: RANGE_BUCKET[range],
  }
}

export function bucketLabel(date: Date | string, bucket: InsightsPeriod['bucket'], periodFrom?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (bucket === 'hour') return `${d.getHours()}h`
  if (bucket === 'day') return DAY_LABELS[d.getDay()]
  if (bucket === 'week') {
    if (!periodFrom) return 'Sem 1'
    const from = new Date(periodFrom)
    const diffDays = Math.floor((d.getTime() - from.getTime()) / 86400000)
    return `Sem ${Math.floor(diffDays / 7) + 1}`
  }
  return MONTH_LABELS[d.getMonth()]
}

export function generateEmptyTrend(bucket: InsightsPeriod['bucket']): TimeSeriesPoint[] {
  const now = new Date()
  if (bucket === 'hour') {
    return Array.from({ length: 24 }, (_, h) => ({ label: `${h}h`, value: 0 }))
  }
  if (bucket === 'day') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(now, 6 - i)
      return { label: DAY_LABELS[d.getDay()], value: 0 }
    })
  }
  if (bucket === 'week') {
    return Array.from({ length: 5 }, (_, i) => ({ label: `Sem ${i + 1}`, value: 0 }))
  }
  return Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(now, 11 - i)
    return { label: MONTH_LABELS[d.getMonth()], value: 0 }
  })
}
