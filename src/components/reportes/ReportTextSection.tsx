import { useId, useState } from 'react'
import { LuChevronDown, LuRotateCcw, LuSparkles } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { IDEAS_SECTION_KEY, parseIdeas, serializeIdeas, type IdeasDoc } from '@/lib/reportes/ideas-format'
import { getRationaleMetrics, type DeltaTone } from '@/lib/reportes/rationale-metrics'
import type { ReportText } from '@/lib/reportes/types'
import { IdeasEditor } from './IdeasEditor'

// Soft tinted pill (CRM style): the triangle gives the direction, the color
// whether that is good. Spend is never judged, so it stays muted.
const DELTA_STYLE: Record<DeltaTone, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  danger: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  neutral: 'border-border bg-muted text-muted-foreground',
}

function DeltaTriangle({ direction }: { direction: 'up' | 'down' | 'flat' }) {
  if (direction === 'flat') return null
  return (
    <svg viewBox="0 0 10 10" className={`size-2 fill-current ${direction === 'down' ? 'rotate-180' : ''}`} aria-hidden>
      <path d="M5 1.5 9 8.5H1z" />
    </svg>
  )
}

interface Props {
  text: Pick<ReportText, 'id' | 'section_key' | 'section_label' | 'ai_text' | 'ai_rationale'>
  value: string
  /** The saved text differs from the AI text (drives the badge and the restore button). */
  edited: boolean
  readOnly: boolean
  onChange: (value: string) => void
  onRestore: () => void
  /** `reports.report_data`; feeds the metric chips of the rationale. */
  reportData?: unknown
}

function parseOrNull(isIdeas: boolean, text: string): IdeasDoc | null {
  if (!isIdeas) return null
  const parsed = parseIdeas(text)
  return parsed.ok ? parsed.doc : null
}

export function ReportTextSection({ text, value, edited, readOnly, onChange, onRestore, reportData }: Props) {
  const [rationaleOpen, setRationaleOpen] = useState(false)
  const rationaleId = useId()
  const metrics = getRationaleMetrics(reportData)
  const inputId = `report-text-${text.id}`
  // Safety net: legacy labels were stored as "A — B".
  const sectionLabel = text.section_label.replaceAll(' — ', ': ')
  const isIdeas = text.section_key === IDEAS_SECTION_KEY
  // Structured doc while the text follows the ideas format; null = free text.
  // Decided on mount and on restore, so typing never swaps the editor mid-way.
  const [ideasDoc, setIdeasDoc] = useState<IdeasDoc | null>(() => parseOrNull(isIdeas, value))
  // Also offered while an unsaved edit is pending, not only after it was saved.
  const canRestore = !readOnly && (edited || value !== text.ai_text)

  function handleIdeasChange(doc: IdeasDoc) {
    setIdeasDoc(doc)
    onChange(serializeIdeas(doc))
  }

  function handleRestore() {
    setIdeasDoc(parseOrNull(isIdeas, text.ai_text))
    onRestore()
  }

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        {ideasDoc ? (
          <h2 className="text-sm font-semibold text-foreground">{sectionLabel}</h2>
        ) : (
          <label htmlFor={inputId} className="text-sm font-semibold text-foreground">
            {sectionLabel}
          </label>
        )}
        {edited && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Editado
          </span>
        )}
      </div>

      {ideasDoc ? (
        <IdeasEditor value={ideasDoc} readOnly={readOnly} onChange={handleIdeasChange} />
      ) : (
        <>
          {isIdeas && (
            <p className="text-xs text-muted-foreground">
              Este texto no tiene el formato de ideas; se edita como texto libre.
            </p>
          )}
          <Textarea
            id={inputId}
            value={value}
            readOnly={readOnly}
            rows={6}
            maxLength={10000}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[140px] leading-relaxed"
          />
        </>
      )}

      {canRestore && (
        <div className="flex justify-end">
          <Button type="button" size="sm" variant="outline" onClick={handleRestore}>
            <LuRotateCcw /> Restaurar texto IA
          </Button>
        </div>
      )}

      {text.ai_rationale && (
        <div className="rounded-lg border border-border bg-accent/50 dark:bg-accent/40">
          <button
            type="button"
            onClick={() => setRationaleOpen((o) => !o)}
            aria-expanded={rationaleOpen}
            aria-controls={rationaleId}
            className="flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <LuSparkles className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="flex-1">Por qué la IA escribió esto</span>
            <LuChevronDown
              className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${rationaleOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
          {rationaleOpen && (
            <div id={rationaleId} className="space-y-3 px-3 pb-3">
              <p className="max-w-prose whitespace-pre-line text-sm leading-relaxed text-foreground">
                {text.ai_rationale}
              </p>
              {metrics.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {metrics.map((m) => (
                    <li
                      key={m.key}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs tabular-nums"
                    >
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-semibold text-foreground">{m.value}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-semibold ${DELTA_STYLE[m.tone]}`}
                      >
                        <DeltaTriangle direction={m.direction} />
                        {m.delta}
                        <span className="sr-only">{m.direction === 'up' ? 'más' : m.direction === 'down' ? 'menos' : 'sin cambios'} que el mes anterior</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
