import type { SupabaseClient } from '@supabase/supabase-js'
import type { RawLead, RatioMetric, DistributionSlice, FunnelStage, TimeSeriesPoint, InsightsPeriod } from '../types'
import { STAGE_COLORS, STAGE_LABELS } from '../types'
import { generateEmptyTrend, bucketLabel } from '../period'

export async function getLeadsCount(
  supabase: SupabaseClient,
  clientId: string,
  from: string,
  to: string
): Promise<number> {
  const { count, error } = await supabase
    .from('gn_leads')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('channel', 'whatsapp')
    .gte('first_contact_at', from)
    .lte('first_contact_at', to)

  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function getLeadsForPeriod(
  supabase: SupabaseClient,
  clientId: string,
  from: string,
  to: string
): Promise<RawLead[]> {
  const { data, error } = await supabase
    .from('gn_leads')
    .select('first_contact_at, stage, material, intencion, ubicacion, derivado, calificado, comercial_asignado')
    .eq('client_id', clientId)
    .eq('channel', 'whatsapp')
    .gte('first_contact_at', from)
    .lte('first_contact_at', to)

  if (error) throw new Error(error.message)
  return (data ?? []) as RawLead[]
}

export async function getAvgMessagesPerConversation(
  supabase: SupabaseClient,
  clientId: string,
  from: string,
  to: string,
  leadsCount: number
): Promise<number> {
  const { count, error } = await supabase
    .from('gn_messages')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .gte('created_at', from)
    .lte('created_at', to)

  if (error) throw new Error(error.message)
  const msgCount = count ?? 0
  return leadsCount > 0 ? Math.round(msgCount / leadsCount) : 0
}

export function getDerivationRate(leads: RawLead[]): RatioMetric {
  const positive = leads.filter((l) => l.derivado === true).length
  const total = leads.length
  const negative = total - positive
  return {
    rate: total > 0 ? (positive / total) * 100 : 0,
    positive,
    negative,
    total,
    positiveLabel: 'Derivados',
    negativeLabel: 'No derivados',
  }
}

export function getQualifiedRate(leads: RawLead[]): RatioMetric {
  const positive = leads.filter((l) => l.calificado === true).length
  const total = leads.length
  const negative = total - positive
  return {
    rate: total > 0 ? (positive / total) * 100 : 0,
    positive,
    negative,
    total,
    positiveLabel: 'Calificados',
    negativeLabel: 'No calificados',
  }
}

export function getLeadsTrend(
  leads: RawLead[],
  timeFilter: 'daily' | 'monthly' | 'annual',
  period: InsightsPeriod
): TimeSeriesPoint[] {
  const trend = generateEmptyTrend(timeFilter)

  for (const lead of leads) {
    if (!lead.first_contact_at) continue
    const label = bucketLabel(lead.first_contact_at, timeFilter, period.from)
    const point = trend.find((p) => p.label === label)
    if (point) point.value += 1
  }

  return trend
}

function groupAndSort(items: (string | null)[], labelMap?: Record<string, string>): DistributionSlice[] {
  const counts: Record<string, number> = {}
  for (const item of items) {
    if (!item || item.trim() === '') continue
    const label = labelMap?.[item] ?? item
    counts[label] = (counts[label] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

export function getByMaterial(leads: RawLead[]): DistributionSlice[] {
  return groupAndSort(leads.map((l) => l.material))
}

const INTENCION_LABELS: Record<string, string> = {
  presupuesto: 'Presupuesto',
  postventa: 'Postventa',
  otro: 'Otro',
}

export function getByIntencion(leads: RawLead[]): DistributionSlice[] {
  return groupAndSort(leads.map((l) => l.intencion), INTENCION_LABELS)
}

export function getByComercial(leads: RawLead[]): DistributionSlice[] {
  const derived = leads.filter((l) => l.derivado === true)
  return groupAndSort(derived.map((l) => l.comercial_asignado))
}

export function getTopUbicaciones(leads: RawLead[]): DistributionSlice[] {
  return groupAndSort(leads.map((l) => l.ubicacion)).slice(0, 6)
}

const KNOWN_STAGES: FunnelStage['stage'][] = [
  'nuevo',
  'conversando',
  'derivado',
  'cerrado',
  'sin_respuesta',
]

export function getByStage(leads: RawLead[]): FunnelStage[] {
  const counts: Record<string, number> = {}
  for (const lead of leads) {
    if (!lead.stage) continue
    counts[lead.stage] = (counts[lead.stage] ?? 0) + 1
  }
  return KNOWN_STAGES.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    value: counts[stage] ?? 0,
    color: STAGE_COLORS[stage],
  }))
}
