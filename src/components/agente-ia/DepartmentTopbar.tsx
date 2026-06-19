'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { IconType } from 'react-icons'
import { LuChevronDown, LuMegaphone, LuDollarSign, LuPalette, LuBriefcase } from 'react-icons/lu'
import type { Department } from '@/lib/agente-ia/types'

type DeptDef = {
  id: string
  label: string
  icon: IconType
  enabled: boolean
}

const DEPARTMENTS: DeptDef[] = [
  { id: 'cm',        label: 'Community Manager', icon: LuMegaphone,  enabled: true },
  { id: 'ads',       label: 'Ads Manager',       icon: LuDollarSign, enabled: false },
  { id: 'design',    label: 'Diseño',            icon: LuPalette,    enabled: false },
  { id: 'comercial', label: 'Comercial',         icon: LuBriefcase,  enabled: false },
]

interface DepartmentSelectorProps {
  value: Department
  onChange: (dept: Department) => void
}

export function DepartmentSelector({ value, onChange }: DepartmentSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const active = DEPARTMENTS.find((d) => d.id === value) ?? DEPARTMENTS[0]
  const ActiveIcon = active.icon

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function pick(d: DeptDef) {
    if (!d.enabled) return
    setOpen(false)
    if (d.id !== value) onChange(d.id as Department)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.06] py-1.5 pl-2.5 pr-2 text-xs font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary/10"
      >
        <ActiveIcon className="h-3.5 w-3.5" />
        <span className="max-w-[140px] truncate">{active.label}</span>
        <LuChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
            className="absolute bottom-full left-0 z-50 mb-2 w-60 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-[0_12px_40px_-12px_rgba(20,20,40,0.35)]"
          >
            <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Departamento
            </p>
            {DEPARTMENTS.map((d) => {
              const Icon = d.icon
              const isActive = d.id === value
              return (
                <button
                  key={d.id}
                  type="button"
                  disabled={!d.enabled}
                  onClick={() => pick(d)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/10 font-semibold text-primary'
                      : d.enabled
                        ? 'text-foreground hover:bg-secondary'
                        : 'cursor-not-allowed text-muted-foreground/50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{d.label}</span>
                  {!d.enabled && (
                    <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Pronto
                    </span>
                  )}
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
