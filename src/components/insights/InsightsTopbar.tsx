'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import type { InsightsRange } from '@/lib/insights/types'

const HEADER_SLOT_ID = 'dashboard-header-slot'

const RANGES: { value: InsightsRange; label: string }[] = [
  { value: 'hoy', label: 'Hoy' },
  { value: '7d', label: '7 Días' },
  { value: '30d', label: '30 Días' },
  { value: 'todo', label: 'Todo' },
]

function Controls({
  value,
  onChange,
}: {
  value: InsightsRange
  onChange: (next: InsightsRange) => void
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* WhatsApp badge — futuro dropdown chatbot/mail. Solo desktop. */}
      <span className="hidden items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20 sm:inline-flex dark:text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        WhatsApp
      </span>

      {/* Range pills */}
      <div className="flex items-center gap-0.5 rounded-lg bg-secondary p-1">
        {RANGES.map((r) => {
          const active = value === r.value
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => onChange(r.value)}
              className={`relative rounded-md px-2 py-1 text-xs font-semibold transition-colors sm:px-2.5 ${
                active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="insightsRange"
                  className="absolute inset-0 rounded-md bg-primary shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{r.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function InsightsTopbar(props: {
  value: InsightsRange
  onChange: (next: InsightsRange) => void
}) {
  const [host, setHost] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHost(document.getElementById(HEADER_SLOT_ID))
  }, [])

  if (!host) return null
  return createPortal(<Controls {...props} />, host)
}
