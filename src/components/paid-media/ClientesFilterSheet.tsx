'use client'

import { useState } from 'react'
import { LuX as X } from 'react-icons/lu'
import { SheetShell } from '@/components/ui/sheet-shell'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ClientesFilters } from '@/lib/paid-media/filters'
import { PLATFORM_LABEL, type ManagementStatus, type Platform } from '@/lib/paid-media/types'

// Único lugar donde se configuran las tres dimensiones discretas (estado,
// plataforma, operador), en desktop y en mobile. Antes desktop tenía tres
// `Select` sueltos más un botón "Aplicar" en la cabecera y mobile este sheet;
// ahora los dos entran por el botón "Filtrar" de `ClientesTopbar`. El buscador
// NO vive acá: es una interacción continua (debounce + push al tipear), no una
// selección discreta que espera confirmación.
//
// El comportamiento diferido se mantiene: elegir valores solo escribe en el
// estado `local`; recién "Aplicar" llama a `onApply`, que dispara UNA sola
// navegación por más dimensiones que hayan cambiado.
//
// `SheetShell` aporta portal, backdrop, Escape, scroll-lock, trap de Tab y el
// responsive bottom sheet (mobile) / modal centrado (desktop), así que este
// archivo solo describe el cuerpo.

const TODOS = 'todos'

// El sheet es `z-[60]`; Radix portalea el desplegable a `document.body`, donde
// el `z-50` por defecto de `SelectContent` quedaría por debajo. Mismo remedio
// que `ReportSheet` y `AccountForm`.
const SELECT_CONTENT_CLASS = 'z-[70]'

interface Props {
  draft: ClientesFilters
  statuses: ManagementStatus[]
  operators: string[]
  onApply: (next: ClientesFilters) => void
  onClose: () => void
}

interface FieldProps {
  label: string
  value: string
  placeholder: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}

function FilterField({ label, value, placeholder, options, onChange }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <Select value={value || TODOS} onValueChange={(v) => onChange(v === TODOS ? '' : v)}>
        <SelectTrigger className="h-10 w-full" aria-label={label}>
          <SelectValue className="truncate" />
        </SelectTrigger>
        <SelectContent position="popper" className={`${SELECT_CONTENT_CLASS} border-accent`}>
          <SelectItem value={TODOS} className="truncate focus:bg-secondary ease-in duration-75">
            {placeholder}
          </SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="truncate focus:bg-secondary ease-in duration-75">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function ClientesFilterSheet({ draft, statuses, operators, onApply, onClose }: Props) {
  const [local, setLocal] = useState<ClientesFilters>(draft)

  return (
    <SheetShell ariaLabel="Filtrar clientes" onClose={onClose} maxWidthClassName="sm:max-w-[420px]">
      {(requestClose) => (
        <>
          <div className="sticky top-0 flex justify-center bg-card pt-3 pb-1 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-muted" />
          </div>

          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <p className="text-sm font-semibold text-foreground">Filtrar clientes</p>
            <button
              type="button"
              onClick={requestClose}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-4 p-5">
            <FilterField
              label="Estado"
              value={local.status}
              placeholder="Todos los estados"
              onChange={(v) => setLocal((prev) => ({ ...prev, status: v }))}
              options={statuses.map((s) => ({ value: s.key, label: s.label }))}
            />

            <FilterField
              label="Plataforma"
              value={local.platform}
              placeholder="Todas las plataformas"
              onChange={(v) => setLocal((prev) => ({ ...prev, platform: v }))}
              options={(Object.keys(PLATFORM_LABEL) as Platform[]).map((p) => ({
                value: p,
                label: PLATFORM_LABEL[p],
              }))}
            />

            <FilterField
              label="Operador"
              value={local.operator}
              placeholder="Todos los operadores"
              onChange={(v) => setLocal((prev) => ({ ...prev, operator: v }))}
              options={operators.map((o) => ({ value: o, label: o }))}
            />
          </div>

          <div className="flex gap-2 border-t border-border px-5 pb-8 pt-3 sm:pb-5">
            <button
              type="button"
              onClick={requestClose}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => {
                onApply(local)
                requestClose()
              }}
              className="flex-1 rounded-lg bg-primary/80 px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary ease-in duration-150"
            >
              Aplicar
            </button>
          </div>
        </>
      )}
    </SheetShell>
  )
}
