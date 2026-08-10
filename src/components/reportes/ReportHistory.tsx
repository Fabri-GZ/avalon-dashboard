'use client'

import { LuPlus, LuLoader } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { AccountRow, Report, ReportStatus } from '@/lib/reportes/types'
import { periodLabel, generatedAt } from '@/lib/reportes/format'
import { ReportRowAction } from './ReportRowAction'

const STATUS: Record<
  ReportStatus | 'none',
  { label: string; cls: string; dot: string; spin?: boolean }
> = {
  pending: { label: 'En cola', cls: 'bg-orange-500/10 text-orange-700 ring-orange-500/20 dark:text-orange-400', dot: 'bg-orange-500' },
  running: { label: 'Generando…', cls: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400', dot: 'bg-amber-500', spin: true },
  done: { label: 'Listo', cls: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400', dot: 'bg-emerald-500' },
  error: { label: 'Error', cls: 'bg-destructive/10 text-destructive ring-destructive/20', dot: 'bg-destructive' },
  none: { label: 'Sin reporte', cls: 'bg-secondary text-muted-foreground ring-border', dot: 'bg-muted-foreground/50' },
}

function StatusBadge({ status }: { status: ReportStatus | 'none' }) {
  const s = STATUS[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${s.cls}`}>
      {s.spin ? (
        <LuLoader className="h-3 w-3 animate-spin" />
      ) : (
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      )}
      {s.label}
    </span>
  )
}

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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
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
                <th className="px-5 py-2.5 text-right font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ account, latest }) => (
                <tr key={account.id} className="border-t border-border/60">
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
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end">
                      <ReportRowAction
                        latest={latest}
                        accountId={account.id}
                        onGenerateFor={onGenerateFor}
                        onRetry={onRetry}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
