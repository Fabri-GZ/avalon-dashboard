'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion'
import { BarChart3, AlertTriangle, Users, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDashboardData } from '@/contexts/DashboardDataContext'
import { createClient } from '@/app/utils/supabase/client'
import { getInsightsFetcher } from '@/lib/insights/registry'
import { buildInsightsPeriod } from '@/lib/insights/period'
import type { InsightsData, InsightsRange } from '@/lib/insights/types'
import { containerVariants, cardVariants } from './chartTheme'
import StatCard from '@/app/components/Dashboard/StatCard'
import { RatioPieCard } from './RatioPieCard'
import { LeadsTrendChart } from './LeadsTrendChart'
import { DistributionPieCard } from './DistributionPieCard'
import { HorizontalBarCard } from './HorizontalBarCard'
import { InsightsTopbar } from './InsightsTopbar'

const supabase = createClient()

function SkeletonCard({ height = 118 }: { height?: number }) {
  return (
    <div
      className="bg-card rounded-xl border border-secondary animate-pulse"
      style={{ height }}
    />
  )
}

export function InsightsDashboard() {
  const { selectedClient, dataLoading } = useDashboardData()
  const reducedMotion = useReducedMotion()

  const [range, setRange] = useState<InsightsRange>('30d')
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [noFetcher, setNoFetcher] = useState(false)

  useEffect(() => {
    const clientId = selectedClient?.clientId
    if (!clientId) return

    const fetcher = getInsightsFetcher(clientId)
    /* eslint-disable react-hooks/set-state-in-effect */
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
    /* eslint-enable react-hooks/set-state-in-effect */

    const period = buildInsightsPeriod(range)
    fetcher({ supabase, clientId, period, range })
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
  }, [selectedClient?.clientId, range, retryKey])

  const containerVars = (reducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0 } } }
    : containerVariants) as Variants

  const cardVars = (reducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.15 } } }
    : cardVariants) as Variants

  const totalLeadsChange =
    data && data.totalLeads.previous > 0 ? data.totalLeads.deltaPct : undefined

  return (
    <motion.div
      key={selectedClient?.clientId}
      initial="hidden"
      animate="visible"
      variants={containerVars}
      className="space-y-6"
    >
      <InsightsTopbar value={range} onChange={setRange} />

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

      {(loading && !data) && !error && !noFetcher && (
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

      {data && !error && !noFetcher && (
        <AnimatePresence mode="wait">
          <motion.div
            key={range}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className={`space-y-6 transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <motion.div
              variants={containerVars}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <StatCard
                title="Total leads"
                value={data.totalLeads.value}
                change={totalLeadsChange}
                icon={Users}
                index={0}
              />
              <RatioPieCard
                label="Tasa de derivación"
                ratio={data.derivationRate}
              />
              <RatioPieCard
                label="Leads cerrados"
                ratio={data.closedRate}
              />
              <StatCard
                title="Mensajes totales"
                value={data.totalMessages}
                change={undefined}
                icon={MessageSquare}
                index={3}
              />
            </motion.div>

            <motion.div
              variants={containerVars}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <motion.div variants={cardVars} className="lg:col-span-2">
                <LeadsTrendChart data={data.leadsTrend} />
              </motion.div>
              <motion.div variants={cardVars} className="lg:col-span-1">
                <DistributionPieCard title="Por material" data={data.byMaterial} />
              </motion.div>
            </motion.div>

            <motion.div
              variants={containerVars}
              initial="hidden"
              animate="visible"
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

            <motion.div variants={cardVars} initial="hidden" animate="visible">
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
