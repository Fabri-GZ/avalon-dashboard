'use client'

import { useState } from 'react'
import { LuChevronDown as ChevronDown, LuCheck as Check, LuX as X, LuFileChartColumn } from 'react-icons/lu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { SheetShell } from '@/components/ui/sheet-shell'
import { MONTHS } from '@/lib/reportes/format'
import type { AccountOption } from '@/lib/reportes/types'

// Mismo mensaje que ReportRowActions: el pipeline de n8n solo sabe leer
// insights de Meta hoy, así que no hay generación posible para google/tiktok.
const NON_META_REASON = 'El pipeline de reportes solo soporta cuentas de Meta por ahora'

function defaultPeriod() {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

interface Props {
  accounts: AccountOption[]
  defaultAccountId?: string | null
  onGenerate: (accountId: string, year: number, month: number) => void
  onClose: () => void
}

export function ReportSheet({ accounts, defaultAccountId, onGenerate, onClose }: Props) {
  const dft = defaultPeriod()
  const [accountId, setAccountId] = useState<string>(defaultAccountId ?? '')
  const [month, setMonth] = useState<number>(dft.month)
  const [year, setYear] = useState<number>(dft.year)

  const selected = accounts.find((a) => a.id === accountId) ?? null
  const currentYear = new Date().getFullYear()
  const years = [currentYear, currentYear - 1, currentYear - 2]
  const selectedIsNonMeta = selected !== null && selected.platform !== 'meta'

  return (
    <SheetShell ariaLabel="Generar reporte" onClose={onClose}>
      {(requestClose) => {
        function submit() {
          if (!accountId || selectedIsNonMeta) return
          onGenerate(accountId, year, month)
          requestClose()
        }

        return (
          <>
            {/* Drag handle (mobile) */}
            <div className="sticky top-0 flex justify-center bg-card pt-3 pb-1 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-muted" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between border-b border-border px-5 pt-4 pb-3">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Nuevo reporte
                </p>
                <h2 className="text-base font-semibold leading-snug">Generar reporte</h2>
              </div>
              <button
                onClick={requestClose}
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
                aria-label="Cerrar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 px-5 py-4">
              {/* Cuenta — dropdown estilo CRM */}
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Cuenta
                </p>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    data-autofocus
                    className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors hover:border-primary/30 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15"
                  >
                    <span className={selected ? 'font-medium' : 'text-muted-foreground'}>
                      {selected ? selected.name : 'Seleccioná una cuenta'}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="z-[70] max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto border-border p-1.5 shadow-lg"
                  >
                    {accounts.map((a) => {
                      const active = a.id === accountId
                      const nonMeta = a.platform !== 'meta'
                      return (
                        <DropdownMenuItem
                          key={a.id}
                          disabled={nonMeta}
                          title={nonMeta ? NON_META_REASON : undefined}
                          onSelect={() => setAccountId(a.id)}
                          className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${
                            active
                              ? 'bg-primary/5 shadow-[inset_2px_0_0_0_var(--primary)] focus:bg-primary/10'
                              : 'focus:bg-secondary focus:text-foreground'
                          }`}
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <div className="min-w-0 flex-1 leading-tight">
                            <div className="truncate text-sm font-semibold text-foreground">
                              {a.name}
                            </div>
                            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                              {nonMeta
                                ? NON_META_REASON
                                : `${a.business_name ? `${a.business_name} · ` : ''}${a.id}`}
                            </div>
                          </div>
                          {active && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Período */}
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Período
                </p>
                <div className="flex gap-2.5">
                  <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                    <SelectTrigger className="h-10 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[70] border-border">
                      {MONTHS.map((m, i) => (
                        <SelectItem
                          key={m}
                          value={String(i + 1)}
                          className="focus:bg-secondary focus:text-foreground"
                        >
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                    <SelectTrigger className="h-10 w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[70] border-border">
                      {years.map((y) => (
                        <SelectItem
                          key={y}
                          value={String(y)}
                          className="focus:bg-secondary focus:text-foreground"
                        >
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="h-11 w-full text-sm font-bold transition-all hover:shadow-md hover:shadow-primary/30 active:scale-[0.98]"
                disabled={!accountId || selectedIsNonMeta}
                onClick={submit}
              >
                <LuFileChartColumn className="size-4" /> Generar reporte
              </Button>

              <p className="rounded-lg bg-secondary px-3 py-2.5 text-[11.5px] text-muted-foreground">
                {selectedIsNonMeta
                  ? NON_META_REASON
                  : 'Se genera en segundo plano. Vas a ver el estado en el historial y un link cuando esté listo.'}
              </p>
            </div>
          </>
        )
      }}
    </SheetShell>
  )
}
