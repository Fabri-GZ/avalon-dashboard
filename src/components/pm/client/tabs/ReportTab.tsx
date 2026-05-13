import { SemaphoreCard } from '@/components/pm/ui/SemaphoreCard'
import { formatDate } from '@/lib/pm/utils'
import type { Report } from '@/lib/pm/types'

export function ReportTab({ report }: { report: Report | null }) {
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 rounded-card bg-gray-100 flex items-center justify-center mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <p className="font-unbounded font-bold text-sm text-text mb-1">Sin reporte generado</p>
        <p className="text-xs text-text-muted font-poppins text-center max-w-xs">
          Hacé click en &quot;Generar Reporte&quot; para analizar el scope vs las tareas de Asana
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <SemaphoreCard value="green"  activeStatus={report.status} />
        <SemaphoreCard value="yellow" activeStatus={report.status} />
        <SemaphoreCard value="red"    activeStatus={report.status} />
      </div>

      {report.summary && (
        <div className="bg-white rounded-card shadow-card p-5">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-poppins mb-3">Resumen</p>
          <p className="text-sm font-poppins text-text leading-relaxed">{report.summary}</p>
        </div>
      )}

      {report.deviations.length > 0 && (
        <div className="bg-white rounded-card shadow-card p-5">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-poppins mb-3">Desvíos detectados</p>
          <ul className="space-y-0.5">
            {report.deviations.map((d, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm font-poppins text-text py-2 border-b border-border last:border-0">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-gray-400" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.risks.length > 0 && (
        <div className="bg-white rounded-card shadow-card p-5">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-poppins mb-3">Riesgos</p>
          <ul className="space-y-0.5">
            {report.risks.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm font-poppins text-text py-2 border-b border-border last:border-0">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-red-300" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.recommendations.length > 0 && (
        <div className="bg-white rounded-card shadow-card p-5">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-poppins mb-3">Recomendaciones</p>
          <ul className="space-y-0.5">
            {report.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm font-poppins text-text py-2 border-b border-border last:border-0">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-brand" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[10px] text-text-muted font-poppins">
        Generado el {formatDate(report.generated_at)}
      </p>
    </div>
  )
}
