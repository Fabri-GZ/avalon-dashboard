'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal } from 'lucide-react'
import { CrmFilterSheet } from './CrmFilterSheet'
import { useDateRangeParam } from '@/hooks/useDateRangeParam'
import type { CrmDateRange } from '@/lib/crm/types'

const HEADER_SLOT_ID = 'dashboard-header-slot'

const CRM_RANGES = ['7d', '30d', '90d', 'todo'] as const

const RANGE_LABELS: Record<CrmDateRange, string> = {
  '7d': '7 Días',
  '30d': '30 Días',
  '90d': '90 Días',
  'todo': 'Todo',
}

interface CrmTopbarProps {
  search: string
  onSearchChange: (search: string) => void
  initialDateRange: CrmDateRange
  total: number
}

function Controls({ search, onSearchChange, initialDateRange, total }: CrmTopbarProps) {
  const [localSearch, setLocalSearch] = useState(search)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dateRange, setDateRange] = useDateRangeParam<CrmDateRange>(CRM_RANGES, initialDateRange)

  const hasFilter = dateRange !== 'todo'

  useEffect(() => {
    const id = setTimeout(() => {
      if (localSearch !== search) onSearchChange(localSearch)
    }, 250)
    return () => clearTimeout(id)
  }, [localSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="relative w-40 sm:w-44 lg:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Buscar…"
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          />
        </div>

        {/* Filter icon — solo visible en mobile */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:text-foreground sm:hidden"
          aria-label="Filtros"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {hasFilter && (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </button>

        {/* WA chip — solo desktop */}
        <span className="hidden items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20 sm:inline-flex dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          WhatsApp
        </span>

        {/* Date range pills — solo desktop */}
        <div className="hidden items-center gap-0.5 rounded-lg bg-secondary p-1 sm:flex">
          {CRM_RANGES.map((r) => {
            const active = dateRange === r
            return (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                className={`relative rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="crmDateRange"
                    className="absolute inset-0 rounded-md bg-primary shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{RANGE_LABELS[r]}</span>
              </button>
            )
          })}
        </div>

        {/* Total — solo desktop */}
        <div className="hidden items-baseline gap-1 border-l border-border pl-3 md:flex">
          <span className="text-lg font-bold tabular-nums leading-none text-foreground">{total}</span>
          <span className="text-xs text-muted-foreground">{total === 1 ? 'lead' : 'leads'}</span>
        </div>
      </div>

      {/* Bottom sheet — solo se monta cuando está abierto */}
      {sheetOpen && (
        <CrmFilterSheet
          value={dateRange}
          total={total}
          onApply={(next) => setDateRange(next)}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </>
  )
}

export function CrmTopbar(props: CrmTopbarProps) {
  const [host, setHost] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHost(document.getElementById(HEADER_SLOT_ID))
  }, [])

  if (!host) return null
  return createPortal(<Controls {...props} />, host)
}
