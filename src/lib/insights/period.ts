import type { Period, InsightsPeriod, TimeSeriesPoint } from './types'

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

function subWeeks(date: Date, n: number): Date {
  return new Date(date.getTime() - n * 7 * 86400000)
}

function subMonths(date: Date, n: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() - n)
  return d
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function getPeriodRange(timeFilter: 'daily' | 'monthly' | 'annual'): Period {
  const now = new Date()
  if (timeFilter === 'daily') {
    return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) }
  }
  if (timeFilter === 'monthly') {
    return { from: startOfDay(subWeeks(now, 3)), to: endOfDay(now) }
  }
  return { from: startOfDay(subMonths(now, 11)), to: endOfDay(now) }
}

export function getPreviousPeriodRange(timeFilter: 'daily' | 'monthly' | 'annual'): Period {
  const current = getPeriodRange(timeFilter)
  const dayBefore = endOfDay(subDays(current.from, 1))
  if (timeFilter === 'daily') {
    return { from: startOfDay(subDays(current.from, 7)), to: dayBefore }
  }
  if (timeFilter === 'monthly') {
    return { from: startOfDay(subWeeks(current.from, 4)), to: dayBefore }
  }
  return { from: startOfDay(subMonths(current.from, 12)), to: dayBefore }
}

export function buildInsightsPeriod(timeFilter: 'daily' | 'monthly' | 'annual'): InsightsPeriod {
  const current = getPeriodRange(timeFilter)
  const prev = getPreviousPeriodRange(timeFilter)
  const bucket: InsightsPeriod['bucket'] =
    timeFilter === 'daily' ? 'day' : timeFilter === 'monthly' ? 'week' : 'month'
  return {
    from: current.from.toISOString(),
    to: current.to.toISOString(),
    prevFrom: prev.from.toISOString(),
    prevTo: prev.to.toISOString(),
    bucket,
  }
}

export function bucketLabel(date: Date | string, timeFilter: 'daily' | 'monthly' | 'annual', periodFrom?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (timeFilter === 'daily') {
    return DAY_LABELS[d.getDay()]
  }

  if (timeFilter === 'monthly') {
    if (!periodFrom) return 'Sem 1'
    const from = new Date(periodFrom)
    const diffMs = d.getTime() - from.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    const weekNum = Math.min(Math.floor(diffDays / 7) + 1, 4)
    return `Sem ${weekNum}`
  }

  return MONTH_LABELS[d.getMonth()]
}

export function generateEmptyTrend(timeFilter: 'daily' | 'monthly' | 'annual'): TimeSeriesPoint[] {
  const now = new Date()
  if (timeFilter === 'daily') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(now, 6 - i)
      return { label: DAY_LABELS[d.getDay()], value: 0 }
    })
  }
  if (timeFilter === 'monthly') {
    return [
      { label: 'Sem 1', value: 0 },
      { label: 'Sem 2', value: 0 },
      { label: 'Sem 3', value: 0 },
      { label: 'Sem 4', value: 0 },
    ]
  }
  return Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(now, 11 - i)
    return { label: MONTH_LABELS[d.getMonth()], value: 0 }
  })
}
