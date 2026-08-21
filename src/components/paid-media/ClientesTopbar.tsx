'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { LuSearch as Search } from 'react-icons/lu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PLATFORM_LABEL, type ManagementStatus, type Platform } from '@/lib/paid-media/types'

// Same slot CrmTopbar, InsightsTopbar and ReportesTopbar portal into: search
// and filters live in the dashboard header, not in a band under it.
const HEADER_SLOT_ID = 'dashboard-header-slot'

// Radix `Select`, never a native `<select>`: the option list of a native one is
// painted by the OS, so it ignores the theme tokens and is unreadable in dark.
const TRIGGER_CLASS = 'h-9 w-[10.5rem]'

interface Props {
  search: string
  onSearchChange: (s: string) => void
  statuses: ManagementStatus[]
  statusFilter: string
  onStatusChange: (s: string) => void
  platformFilter: string
  onPlatformChange: (p: string) => void
  operators: string[]
  operatorFilter: string
  onOperatorChange: (o: string) => void
  total: number
}

function Controls({
  search,
  onSearchChange,
  statuses,
  statusFilter,
  onStatusChange,
  platformFilter,
  onPlatformChange,
  operators,
  operatorFilter,
  onOperatorChange,
  total,
}: Props) {
  const [local, setLocal] = useState(search)

  useEffect(() => {
    const id = setTimeout(() => {
      if (local !== search) onSearchChange(local)
    }, 250)
    return () => clearTimeout(id)
  }, [local]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Search */}
      <div className="relative w-40 sm:w-44 lg:w-56">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder="Buscar cliente…"
          // Placeholder at full muted opacity, not /70: the extra transparency
          // drops it under 4.5:1 in dark. Same call as ReportesTopbar.
          className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
        />
      </div>

      {/* Filters — desktop only. Three variable-length selects do not fit a
          tablet header, and unlike Reportes the options come from data, so a
          pill row is not an option. Mobile filtering needs a sheet like the
          CRM's; until it exists, search still works at every width. */}
      <div className="hidden items-center gap-2 lg:flex">
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className={TRIGGER_CLASS} aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className="border-border">
            <SelectItem value="todos">Todos los estados</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.key} value={s.key}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={platformFilter} onValueChange={onPlatformChange}>
          <SelectTrigger className={TRIGGER_CLASS} aria-label="Filtrar por plataforma">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className="border-border">
            <SelectItem value="todos">Todas las plataformas</SelectItem>
            {(Object.keys(PLATFORM_LABEL) as Platform[]).map((p) => (
              <SelectItem key={p} value={p}>
                {PLATFORM_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={operatorFilter} onValueChange={onOperatorChange}>
          <SelectTrigger className={TRIGGER_CLASS} aria-label="Filtrar por operador">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className="border-border">
            <SelectItem value="todos">Todos los operadores</SelectItem>
            {operators.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Total — desktop */}
      <div className="hidden items-baseline gap-1 border-l border-border pl-3 md:flex">
        <span className="text-lg font-bold tabular-nums leading-none text-foreground">{total}</span>
        <span className="text-xs text-muted-foreground">{total === 1 ? 'cliente' : 'clientes'}</span>
      </div>
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
