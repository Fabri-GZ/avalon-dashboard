import type { InsightsFetcher, InsightsData } from '../types'
import { generateEmptyTrend } from '../period'
import {
  getLeadsCount,
  getLeadsForPeriod,
  getTotalMessages,
  getDerivationRate,
  getClosedRate,
  getLeadsTrend,
  getByMaterial,
  getByIntencion,
  getByComercial,
  getTopUbicaciones,
  getByStage,
} from './queries'

function calcDelta(value: number, previous: number): number {
  if (previous === 0) return value > 0 ? 100 : 0
  return Math.round(((value - previous) / previous) * 100)
}

export const grupoNorteFetcher: InsightsFetcher = async ({
  supabase,
  clientId,
  period,
}) => {
  const { from, to, prevFrom, prevTo, hasComparison, bucket } = period

  const [currentCount, previousCount, leads, totalMessages] = await Promise.all([
    getLeadsCount(supabase, clientId, from, to),
    hasComparison ? getLeadsCount(supabase, clientId, prevFrom, prevTo) : Promise.resolve(0),
    getLeadsForPeriod(supabase, clientId, from, to),
    getTotalMessages(supabase, clientId, from, to),
  ])

  if (leads.length === 0 && currentCount === 0) {
    const result: InsightsData = {
      totalLeads: { value: 0, previous: previousCount, deltaPct: 0 },
      derivationRate: { rate: 0, positive: 0, negative: 0, total: 0, positiveLabel: 'Derivados', negativeLabel: 'No derivados' },
      closedRate: { rate: 0, positive: 0, negative: 0, total: 0, positiveLabel: 'Cerrados', negativeLabel: 'No cerrados' },
      totalMessages,
      leadsTrend: generateEmptyTrend(bucket),
      byMaterial: [],
      byStage: getByStage([]),
      byIntencion: [],
      byComercial: [],
      topUbicaciones: [],
    }
    return result
  }

  return {
    totalLeads: {
      value: currentCount,
      previous: previousCount,
      deltaPct: hasComparison ? calcDelta(currentCount, previousCount) : 0,
    },
    derivationRate: getDerivationRate(leads),
    closedRate: getClosedRate(leads),
    totalMessages,
    leadsTrend: getLeadsTrend(leads, period),
    byMaterial: getByMaterial(leads),
    byStage: getByStage(leads),
    byIntencion: getByIntencion(leads),
    byComercial: getByComercial(leads),
    topUbicaciones: getTopUbicaciones(leads),
  }
}
