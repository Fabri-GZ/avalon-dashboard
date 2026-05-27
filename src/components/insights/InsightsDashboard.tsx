'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { BarChart3, AlertTriangle, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDashboardData } from '@/contexts/DashboardDataContext'
import { useDashboardUI } from '@/contexts/DashboardUIContext'
import { createClient } from '@/app/utils/supabase/client'
import { getInsightsFetcher } from '@/lib/insights/registry'
import { buildInsightsPeriod } from '@/lib/insights/period'
import type { InsightsData } from '@/lib/insights/types'
import { containerVariants, cardVariants } from './chartTheme'
import { StatCardDelta } from './StatCardDelta'
import { RatioPieCard } from './RatioPieCard'
import { LeadsTrendChart } from './LeadsTrendChart'
import { DistributionPieCard } from './DistributionPieCard'
import { HorizontalBarCard } from './HorizontalBarCard'

const supabase = createClient()

const PERIOD_LABELS: Record<string, string> = {
  daily: 'Últimos 7 días',
  monthly: 'Últimas 4 semanas',
  annual: 'Últimos 12 meses',
}

function SkeletonCard({ height = 118 }: { height?: number }) {
  return (
    <div
      className="bg-card rounded-xl border border-secondary animate-pulse"
      style={{ height }}
    />
  )
}

export function InsightsDashboard() {
  const { selectedClient } = useDashboardData()
  const { timeFilter } = useDashboardUI()
  const reducedMotion = useReducedMotion()

  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [noFetcher, setNoFetcher] = useState(false)

  useEffect(() => {
    const clientId = selectedClient?.clientId
    if (!clientId) return

    const fetcher = getInsightsFetcher(clientId)
    if (!fetcher) {
      setData(null)
      setError(null)
      setLoading(false)
      setNoFetcher(true)
      return
    }

    setNoFetcher(false)
    let cancelled = false
    setLoading(true)
    setError(null)
    setData(null)

    const period = buildInsightsPeriod(timeFilter)
    fetcher({ supabase, clientId, period, timeFilter })
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedClient?.clientId, timeFilter, retryKey])

  const clientName = selectedClient?.clientId === 'b7859a5a-d306-488a-ba3d-6733ae8430ad'
    ? 'Grupo Norte'
    : (selectedClient as { name?: string } | null)?.name ?? 'Cliente'

  const containerVars = reducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0 } } }
    : containerVariants

  const cardVars = reducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.15 } } }
    : cardVariants

  return (
    <motion.div
      key={selectedClient?.clientId}
      initial="hidden"
      animate="visible"
      variants={containerVars}
      className="space-y-6"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Insights del chatbot</h2>
          <p className="text-sm text-muted-foreground">Resumen de leads de WhatsApp</p>
        </div>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="font-medium text-foreground">{clientName}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">WhatsApp</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{PERIOD_LABELS[timeFilter]}</span>
        </div>
      </div>

      {noFetcher && (
        <div className="bg-card border border-secondary rounded-xl p-8 text-center max-w-md mx-auto flex flex-col items-center gap-3">
          <BarChart3 size={28} className="text-muted-foreground" />
          <p className="text-base font-semibold text-foreground">Insights no disponibles</p>
          <p className="text-sm text-muted-foreground">
            Este cliente todavía no tiene insights del chatbot configurados.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-card border border-secondary rounded-xl p-8 text-center max-w-md mx-auto flex flex-col items-center gap-3">
          <AlertTriangle size={28} className="text-destructive" />
          <p className="text-base font-semibold text-foreground">No pudimos cargar los insights</p>
          <p className="text-xs text-muted-foreground/70">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={() => setRetryKey((k) => k + 1)}
          >
            Reintentar
          </Button>
        </div>
      )}

      {loading && !error && !noFetcher && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SkeletonCard height={280} />
            <SkeletonCard height={280} />
            <SkeletonCard height={240} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SkeletonCard height={240} />
            <SkeletonCard height={240} />
            <SkeletonCard height={240} />
          </div>
          <SkeletonCard height={200} />
        </div>
      )}

      {data && !loading && !error && !noFetcher && (
        <AnimatePresence mode="wait">
          <motion.div
            key={timeFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className="space-y-6"
          >
            <motion.div
              variants={containerVars}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <StatCardDelta
                label="Total leads"
                value={data.totalLeads.value}
                delta={data.totalLeads}
              />
              <RatioPieCard
                label="Tasa de derivación"
                ratio={data.derivationRate}
              />
              <RatioPieCard
                label="Leads calificados"
                ratio={data.qualifiedRate}
              />
              <StatCardDelta
                label="Mensajes por conv."
                value={data.avgMessagesPerConversation}
                delta={{ value: data.avgMessagesPerConversation, previous: 0, deltaPct: 0 }}
                icon={<MessageSquare size={14} />}
              />
            </motion.div>

            <motion.div
              variants={containerVars}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <motion.div variants={cardVars} className="lg:col-span-2">
                <LeadsTrendChart data={data.leadsTrend} timeFilter={timeFilter} />
              </motion.div>
              <motion.div variants={cardVars} className="lg:col-span-1">
                <DistributionPieCard title="Por material" data={data.byMaterial} />
              </motion.div>
            </motion.div>

            <motion.div
              variants={containerVars}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <motion.div variants={cardVars}>
                <HorizontalBarCard
                  title="Funnel por stage"
                  data={data.byStage}
                  colored
                />
              </motion.div>
              <motion.div variants={cardVars}>
                <DistributionPieCard title="Por intención" data={data.byIntencion} />
              </motion.div>
              <motion.div variants={cardVars}>
                <HorizontalBarCard
                  title="Derivaciones por comercial"
                  data={data.byComercial}
                />
              </motion.div>
            </motion.div>

            <motion.div variants={cardVars}>
              <HorizontalBarCard
                title="Top ubicaciones"
                data={data.topUbicaciones}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  )
}
