'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { LuSearch as Search } from 'react-icons/lu'
import { SHORTCUT_HINT_CLASS, useSearchShortcut } from '@/hooks/useSearchShortcut'
import type { ReportFilter } from '@/lib/reportes/types'

const HEADER_SLOT_ID = 'dashboard-header-slot'

const FILTERS: { value: ReportFilter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'done', label: 'Listos' },
  { value: 'proceso', label: 'En proceso' },
  { value: 'error', label: 'Error' },
]

interface Props {
  search: string
  onSearchChange: (s: string) => void
  filter: ReportFilter
  onFilterChange: (f: ReportFilter) => void
  total: number
}

function Controls({ search, onSearchChange, filter, onFilterChange, total }: Props) {
  const [local, setLocal] = useState(search)
  const { inputRef, shortcutHint } = useSearchShortcut()

  useEffect(() => {
    const id = setTimeout(() => {
      if (local !== search) onSearchChange(local)
    }, 250)
    return () => clearTimeout(id)
  }, [local]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Search */}
      <div className="relative w-40 sm:w-44 lg:w-60">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder="Buscar cuenta…"
          // El /70 sobre un color ya muted dejaba el placeholder por debajo de
          // 4.5:1 en dark. A opacidad plena sigue leyéndose como placeholder
          // (es más claro que --foreground) pero es legible.
          //
          // `text-foreground` es obligatorio, no decorativo: `body` no declara
          // `color` y la hoja del navegador le da a los form controls su propio
          // negro, así que sin esto lo tipeado sale oscuro sobre fondo oscuro
          // en dark. Mismo remedio que ya lleva `ClientesTopbar`.
          className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground lg:pr-12 outline-none transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
        />
        <kbd className={SHORTCUT_HINT_CLASS}>
          {shortcutHint}
        </kbd>
      </div>

      {/* Status filter pills — desktop */}
      <div className="hidden items-center gap-0.5 rounded-lg bg-secondary p-1 sm:flex">
        {FILTERS.map((f) => {
          const active = filter === f.value
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => onFilterChange(f.value)}
              className={`relative rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="reportesFilter"
                  className="absolute inset-0 rounded-md bg-primary shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{f.label}</span>
            </button>
          )
        })}
      </div>

      {/* Total — desktop */}
      <div className="hidden items-baseline gap-1 border-l border-border pl-3 md:flex">
        <span className="text-lg font-bold tabular-nums leading-none text-foreground">{total}</span>
        <span className="text-xs text-muted-foreground">{total === 1 ? 'cuenta' : 'cuentas'}</span>
      </div>
    </div>
  )
}

export function ReportesTopbar(props: Props) {
  const [host, setHost] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHost(document.getElementById(HEADER_SLOT_ID))
  }, [])

  if (!host) return null
  return createPortal(<Controls {...props} />, host)
}
