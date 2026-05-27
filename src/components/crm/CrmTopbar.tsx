'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal } from 'lucide-react'
import { CrmFilterSheet } from './CrmFilterSheet'
import type { Channel } from '@/lib/crm/types'

export type DateRange = 'hoy' | '7d' | '30d' | 'todo'

export interface CrmFilters {
  search: string
  channel: Channel
  dateRange: DateRange
}

const HEADER_SLOT_ID = 'dashboard-header-slot'

const RANGES: { value: DateRange; label: string }[] = [
  { value: 'hoy', label: 'Hoy' },
  { value: '7d', label: '7 Días' },
  { value: '30d', label: '30 Días' },
  { value: 'todo', label: 'Todo' },
]

function Controls({
  value,
  onChange,
  total,
}: {
  value: CrmFilters
  onChange: (next: CrmFilters) => void
  total: number
}) {
  const [search, setSearch] = useState(value.search)
  const [sheetOpen, setSheetOpen] = useState(false)
  const hasFilter = value.dateRange !== 'todo'

  useEffect(() => {
    const id = setTimeout(() => {
      if (search !== value.search) onChange({ ...value, search })
    }, 250)
    return () => clearTimeout(id)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search — crece en mobile para llenar el espacio */}
        <div className="relative w-40 sm:w-44 lg:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          {RANGES.map((r) => {
            const active = value.dateRange === r.value
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => onChange({ ...value, dateRange: r.value })}
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
                <span className="relative z-10">{r.label}</span>
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
          value={value.dateRange}
          total={total}
          onApply={(next) => onChange({ ...value, dateRange: next })}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </>
  )
}

export function CrmTopbar(props: {
  value: CrmFilters
  onChange: (next: CrmFilters) => void
  total: number
}) {
  const [host, setHost] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHost(document.getElementById(HEADER_SLOT_ID))
  }, [])

  if (!host) return null
  return createPortal(<Controls {...props} />, host)
}
