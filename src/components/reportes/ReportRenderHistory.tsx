import type { ReportRender } from '@/lib/reportes/types'
import { StatusBadge } from './StatusBadge'

export type RenderHistoryItem = Pick<
  ReportRender,
  'id' | 'public_id' | 'status' | 'report_url' | 'pdf_url' | 'error' | 'created_at'
>

function renderedAt(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const LINK = 'font-medium underline-offset-2 hover:underline'

export function ReportRenderHistory({ renders }: { renders: RenderHistoryItem[] }) {
  return (
    <section aria-labelledby="render-history-title" className="space-y-2">
      <h2 id="render-history-title" className="text-sm font-semibold text-foreground">
        Reportes finales generados
      </h2>

      {renders.length === 0 ? (
        <p className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          Todavía no generaste ningún reporte final.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {renders.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{renderedAt(r.created_at)}</span>
                <StatusBadge status={r.status} />
              </div>

              {r.status === 'done' && r.report_url && (
                <div className="flex gap-3 text-xs">
                  <a href={r.report_url} target="_blank" rel="noopener noreferrer" className={LINK}>
                    Ver reporte
                  </a>
                  {r.pdf_url && (
                    <a href={r.pdf_url} target="_blank" rel="noopener noreferrer" className={LINK}>
                      PDF
                    </a>
                  )}
                </div>
              )}
              {r.status === 'error' && (
                <p className="w-full text-xs text-destructive">
                  {r.error ?? 'No se pudo generar el reporte'}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
