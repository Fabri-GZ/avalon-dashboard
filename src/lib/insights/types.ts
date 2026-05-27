import type { SupabaseClient } from '@supabase/supabase-js'

export interface Period {
  from: Date
  to: Date
}

export interface InsightsPeriod {
  from: string
  to: string
  prevFrom: string
  prevTo: string
  bucket: 'day' | 'week' | 'month'
}

export interface MetricDelta {
  value: number
  previous: number
  deltaPct: number
}

export interface RatioMetric {
  rate: number
  positive: number
  negative: number
  total: number
  positiveLabel: string
  negativeLabel: string
}

export interface TimeSeriesPoint {
  label: string
  value: number
}

export interface DistributionSlice {
  label: string
  value: number
  color?: string
}

export interface FunnelStage {
  stage: 'nuevo' | 'conversando' | 'derivado' | 'cerrado' | 'sin_respuesta'
  label: string
  value: number
  color: string
}

export const STAGE_COLORS: Record<FunnelStage['stage'], string> = {
  nuevo:         'var(--color-sky-500)',
  conversando:   'var(--color-amber-500)',
  derivado:      'var(--color-violet-500)',
  cerrado:       'var(--color-emerald-500)',
  sin_respuesta: 'var(--color-zinc-400)',
}

export const STAGE_LABELS: Record<FunnelStage['stage'], string> = {
  nuevo:         'Nuevo',
  conversando:   'Conversando',
  derivado:      'Derivado',
  cerrado:       'Cerrado',
  sin_respuesta: 'Sin respuesta',
}

export interface InsightsData {
  totalLeads: MetricDelta
  derivationRate: RatioMetric
  qualifiedRate: RatioMetric
  avgMessagesPerConversation: number
  leadsTrend: TimeSeriesPoint[]
  byMaterial: DistributionSlice[]
  byStage: FunnelStage[]
  byIntencion: DistributionSlice[]
  byComercial: DistributionSlice[]
  topUbicaciones: DistributionSlice[]
}

export interface RawLead {
  first_contact_at: string | null
  stage: string | null
  material: string | null
  intencion: string | null
  ubicacion: string | null
  derivado: boolean | null
  calificado: boolean | null
  comercial_asignado: string | null
}

export type InsightsFetcher = (args: {
  supabase: SupabaseClient
  clientId: string
  period: InsightsPeriod
  timeFilter: 'daily' | 'monthly' | 'annual'
}) => Promise<InsightsData>
