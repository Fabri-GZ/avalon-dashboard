'use client'

import { LuPlus, LuExternalLink, LuRotateCw, LuLoader } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { AccountRow, Report, ReportStatus } from '@/lib/reportes/types'
import { periodLabel, generatedAt } from '@/lib/reportes/format'

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
              <tr className="text-left text-[10.5px] uppercase tracking-wider text-muted-foreground/80">
                <th className="px-5 py-2.5 font-semibold">Cuenta</th>
                <th className="px-5 py-2.5 font-semibold">Último reporte</th>
                <th className="px-5 py-2.5 font-semibold">Generado</th>
                <th className="px-5 py-2.5 font-semibold">Estado</th>
                <th className="px-5 py-2.5 text-right font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ account, latest }) => (
                <tr key={account.id} className="border-t border-border/60">
                  <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-foreground">{account.name}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {latest ? periodLabel(latest.period_year, latest.period_month) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {latest ? generatedAt(latest.created_at) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={latest?.status ?? 'none'} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {latest?.status === 'done' && latest.report_url && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="hover:bg-secondary hover:text-foreground"
                      >
                        <a href={latest.report_url} target="_blank" rel="noopener noreferrer">
                          <LuExternalLink /> Ver
                        </a>
                      </Button>
                    )}
                    {latest?.status === 'error' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-secondary hover:text-foreground"
                        onClick={() => onRetry(latest)}
                      >
                        <LuRotateCw /> Reintentar
                      </Button>
                    )}
                    {!latest && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-secondary hover:text-foreground"
                        onClick={() => onGenerateFor(account.id)}
                      >
                        <LuPlus /> Generar
                      </Button>
                    )}
                    {(latest?.status === 'pending' || latest?.status === 'running') && (
                      <span className="text-xs text-muted-foreground">En curso…</span>
                    )}
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
