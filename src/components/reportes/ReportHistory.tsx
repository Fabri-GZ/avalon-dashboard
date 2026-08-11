'use client'

import { LuPlus } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { AccountRow, Report } from '@/lib/reportes/types'
import { periodLabel, generatedAt } from '@/lib/reportes/format'
import { ReportCard } from './ReportCard'
import { ReportRowActions } from './ReportRowActions'
import { StatusBadge } from './StatusBadge'

interface Props {
  rows: AccountRow[]
  onNew: () => void
  onGenerateFor: (accountId: string) => void
  onRetry: (report: Report) => void
}

export function ReportHistory({ rows, onNew, onGenerateFor, onRetry }: Props) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border px-5 py-4">
        <h2 className="text-[15px] font-semibold tracking-tight">Historial por cuenta</h2>
        <Button
          size="sm"
          className="ml-auto font-bold transition-all hover:shadow-md hover:shadow-primary/30 active:scale-[0.98]"
          onClick={onNew}
        >
          <LuPlus /> Generar reporte
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No hay cuentas que coincidan.</p>
      ) : (
        // Ya no hay `overflow-x-auto` ni `min-w-[640px]`: en vez de empujar la
        // tabla a scrollear de costado en mobile, abajo de `sm` se renderiza una
        // lista de cards. `sm` es el breakpoint que ya usan ReportSheet,
        // TaskCard y ReportesTopbar — no se inventa uno nuevo para esto.
        <div className="hidden sm:block">
          <table className="w-full text-sm">
            <thead>
              {/* 10.5px was below the point where an uppercase, wide-tracked label
                  stays comfortably readable; the /80 opacity on an already muted
                  colour pushed it further down. Size and contrast both go up. */}
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                {/* Constrained so the account column stops sizing itself to the
                    longest name on one line. Names wrap in the cell below. */}
                <th className="w-[24%] px-5 py-2.5 font-semibold">Cuenta</th>
                <th className="px-5 py-2.5 font-semibold">Último reporte</th>
                <th className="px-5 py-2.5 font-semibold">Generado</th>
                <th className="px-5 py-2.5 font-semibold">Estado</th>
                <th className="px-5 py-2.5 font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {/* Antes no había hover de fila: con 22 cuentas, nada seguía el
                  ojo a lo ancho de 5 columnas. `secondary` es el token de hover
                  que ya usa el resto del repo, y al 50% se distingue del fondo
                  sin bajarle el contraste al texto de la fila. */}
              {rows.map(({ account, latest, lastDone }) => (
                <tr
                  key={account.id}
                  className="border-t border-border/60 transition-colors hover:bg-secondary/50"
                >
                  <td className="px-5 py-3.5 font-semibold text-foreground">
                    {/* line-clamp sits on an inner span, never on the <td>: the
                        utility sets display:-webkit-box, which would stop the
                        cell from being a table-cell and break the row layout.

                        `title` carries the exact same string as the text content,
                        never an abbreviation. No aria-label — line-clamp only
                        clips visually, so assistive tech already reads the whole
                        name from the text node, and a label would override it
                        with a duplicate. */}
                    <span className="line-clamp-2 break-words" title={account.name}>
                      {account.name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {latest ? periodLabel(latest.period_year, latest.period_month) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {latest ? generatedAt(latest.created_at) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={latest?.status ?? 'none'} />
                  </td>
                  <td className="w-px whitespace-nowrap px-5 py-3.5">
                    <ReportRowActions
                      latest={latest}
                      lastDone={lastDone}
                      accountId={account.id}
                      onGenerateFor={onGenerateFor}
                      onRetry={onRetry}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <ul className="space-y-2.5 p-3 sm:hidden">
          {rows.map(({ account, latest, lastDone }) => (
            <ReportCard
              key={account.id}
              account={account}
              latest={latest}
              lastDone={lastDone}
              onGenerateFor={onGenerateFor}
              onRetry={onRetry}
            />
          ))}
        </ul>
      )}
    </Card>
  )
}
