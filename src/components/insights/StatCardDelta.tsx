'use client'

import { motion } from 'framer-motion'
import type { MetricDelta } from '@/lib/insights/types'
import { cardVariants } from './chartTheme'

interface StatCardDeltaProps {
  label: string
  value: number
  delta: MetricDelta
  icon?: React.ReactNode
  format?: (n: number) => string
}

export function StatCardDelta({ label, value, delta, icon, format }: StatCardDeltaProps) {
  const displayValue = format ? format(value) : String(value)
  const hasDelta = delta.previous !== 0
  const isPositive = delta.deltaPct >= 0

  return (
    <motion.div
      variants={cardVariants}
      className="bg-card rounded-xl p-5 border border-secondary flex flex-col justify-between min-h-[118px] transition-colors hover:border-border hover:shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {label}
      </div>

      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl max-sm:text-3xl font-bold text-foreground tabular-nums leading-none">
            {displayValue}
          </span>
          {hasDelta && (
            <span
              className={`text-sm font-semibold tabular-nums ${
                isPositive ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {isPositive ? '↑' : '↓'} {Math.abs(delta.deltaPct)}%
            </span>
          )}
        </div>
        {hasDelta && (
          <span className="text-xs text-muted-foreground">vs período anterior</span>
        )}
      </div>
    </motion.div>
  )
}
