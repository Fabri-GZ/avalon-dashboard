'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { DateRange } from './CrmTopbar'

const RANGES: { value: DateRange; label: string; desc: string }[] = [
  { value: 'hoy', label: 'Hoy', desc: 'Solo leads de hoy' },
  { value: '7d', label: '7 Días', desc: 'Últimos 7 días' },
  { value: '30d', label: '30 Días', desc: 'Últimos 30 días' },
  { value: 'todo', label: 'Todo', desc: 'Sin filtro de fecha' },
]

interface Props {
  value: DateRange
  total: number
  onApply: (next: DateRange) => void
  onClose: () => void
}

function SheetContent({ value, total, onApply, onClose }: Props) {
  const [selected, setSelected] = useState<DateRange>(value)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleClose() {
    setClosing(true)
  }

  function handleApply() {
    onApply(selected)
    setClosing(true)
  }

  return (
    <div
      className={`fixed inset-0 z-[60] bg-black/40 ${closing ? 'animate-backdrop-out' : ''}`}
      onClick={handleClose}
    >
      <div
        className={`fixed inset-x-0 bottom-0 rounded-t-2xl bg-card text-card-foreground ${
          closing ? 'animate-sheet-down' : 'animate-sheet-up'
        }`}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={closing ? onClose : undefined}
      >
        {/* Drag handle */}
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-muted" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-sm font-semibold text-foreground">Filtrar por fecha</p>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2 p-4">
          {RANGES.map((r) => {
            const active = selected === r.value
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setSelected(r.value)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                  active
                    ? 'border-primary/40 bg-primary/8 text-foreground ring-1 ring-primary/20'
                    : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-secondary/50 hover:text-foreground'
                }`}
              >
                <div>
                  <p className={`text-sm font-semibold ${active ? 'text-foreground' : ''}`}>
                    {r.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </div>
                {active && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-border px-4 pb-8 pt-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Aplicar · {total} {total === 1 ? 'lead' : 'leads'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function CrmFilterSheet(props: Props) {
  return createPortal(<SheetContent {...props} />, document.body)
}
