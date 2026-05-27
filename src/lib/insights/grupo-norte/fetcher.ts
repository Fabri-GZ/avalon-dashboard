import type { InsightsFetcher, InsightsData } from '../types'
import { generateEmptyTrend } from '../period'
import {
  getLeadsCount,
  getLeadsForPeriod,
  getAvgMessagesPerConversation,
  getDerivationRate,
  getQualifiedRate,
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
  timeFilter,
}) => {
  const { from, to, prevFrom, prevTo } = period

  const [currentCount, previousCount, leads] = await Promise.all([
    getLeadsCount(supabase, clientId, from, to),
    getLeadsCount(supabase, clientId, prevFrom, prevTo),
    getLeadsForPeriod(supabase, clientId, from, to),
  ])

  const avgMessages = await getAvgMessagesPerConversation(supabase, clientId, from, to, currentCount)

  if (leads.length === 0 && currentCount === 0) {
    const result: InsightsData = {
      totalLeads: { value: 0, previous: previousCount, deltaPct: 0 },
      derivationRate: { rate: 0, positive: 0, negative: 0, total: 0, positiveLabel: 'Derivados', negativeLabel: 'No derivados' },
      qualifiedRate: { rate: 0, positive: 0, negative: 0, total: 0, positiveLabel: 'Calificados', negativeLabel: 'No calificados' },
      avgMessagesPerConversation: 0,
      leadsTrend: generateEmptyTrend(timeFilter),
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
      deltaPct: calcDelta(currentCount, previousCount),
    },
    derivationRate: getDerivationRate(leads),
    qualifiedRate: getQualifiedRate(leads),
    avgMessagesPerConversation: avgMessages,
    leadsTrend: getLeadsTrend(leads, timeFilter, period),
    byMaterial: getByMaterial(leads),
    byStage: getByStage(leads),
    byIntencion: getByIntencion(leads),
    byComercial: getByComercial(leads),
    topUbicaciones: getTopUbicaciones(leads),
  }
}
