'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { LuSearch as Search, LuSlidersHorizontal as SlidersHorizontal } from 'react-icons/lu'
import { ClientesFilterSheet } from './ClientesFilterSheet'
import type { ClientesFilters } from '@/lib/paid-media/filters'
import type { ManagementStatus } from '@/lib/paid-media/types'

// Same slot CrmTopbar, InsightsTopbar and ReportesTopbar portal into: search
// and filters live in the dashboard header, not in a band under it.
const HEADER_SLOT_ID = 'dashboard-header-slot'

interface Props {
  /** Filtros ya aplicados (los que `page.tsx` usó server-side). */
  draft: ClientesFilters
  /** Fires exactly one navigation, regardless of how many dimensions changed. */
  onApply: (draft: ClientesFilters) => void
  statuses: ManagementStatus[]
  operators: string[]
  total: number
}

function Controls({ draft, onApply, statuses, operators, total }: Props) {
  const [localSearch, setLocalSearch] = useState(draft.q)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Search stays debounced + push-on-type (D-D): it is a continuous
  // control, unlike the discrete selects "Aplicar" is meant to collapse.
  useEffect(() => {
    const id = setTimeout(() => {
      if (localSearch !== draft.q) onApply({ ...draft, q: localSearch })
    }, 250)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch])

  // Las tres dimensiones discretas ya no se ven en la cabecera (se configuran
  // dentro del sheet), así que el botón tiene que decir cuántas están activas:
  // sin eso, una lista filtrada es indistinguible de una lista completa.
  const activeCount = [draft.status, draft.platform, draft.operator].filter(Boolean).length

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Search — se queda en la cabecera, fuera del sheet. */}
      <div className="relative w-40 sm:w-44 lg:w-56">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Buscar cliente…"
          // Placeholder at full muted opacity, not /70: the extra transparency
          // drops it under 4.5:1 in dark. Same call as ReportesTopbar.
          className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition-all text-accent-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
        />
      </div>

      {/* Un solo punto de entrada a los filtros, igual en desktop y en mobile.
          Antes desktop mostraba tres `Select` sueltos más un "Aplicar" propio;
          el sheet ya hacía lo mismo en mobile, así que ahora los dos comparten
          la misma pantalla y el mismo comportamiento diferido. */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="relative flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground lg:px-3 hover:border-primary duration-150 ease-in"
        aria-label={activeCount > 0 ? `Filtros (${activeCount} activos)` : 'Filtros'}
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span className="hidden lg:inline">Filtrar</span>
        {activeCount > 0 && (
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
            {activeCount}
          </span>
        )}
      </button>

      {/* Total — desktop */}
      <div className="hidden items-baseline gap-1 border-l border-border pl-3 md:flex">
        <span className="text-lg font-bold tabular-nums leading-none text-foreground">{total}</span>
        <span className="text-xs text-muted-foreground">{total === 1 ? 'cliente' : 'clientes'}</span>
      </div>

      {sheetOpen && (
        <ClientesFilterSheet
          draft={draft}
          statuses={statuses}
          operators={operators}
          onApply={onApply}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  )
}

export function ClientesTopbar(props: Props) {
  const [host, setHost] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHost(document.getElementById(HEADER_SLOT_ID))
  }, [])

  if (!host) return null
  return createPortal(<Controls {...props} />, host)
}
