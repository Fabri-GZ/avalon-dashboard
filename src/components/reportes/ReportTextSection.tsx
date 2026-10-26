import { LuRotateCcw } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { ReportText } from '@/lib/reportes/types'

interface Props {
  text: Pick<ReportText, 'id' | 'section_label' | 'ai_text' | 'ai_rationale'>
  value: string
  /** The saved text differs from the AI text (drives the badge and the restore button). */
  edited: boolean
  readOnly: boolean
  onChange: (value: string) => void
  onRestore: () => void
}

export function ReportTextSection({ text, value, edited, readOnly, onChange, onRestore }: Props) {
  const inputId = `report-text-${text.id}`
  // Also offered while an unsaved edit is pending, not only after it was saved.
  const canRestore = !readOnly && (edited || value !== text.ai_text)

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-semibold">
          {text.section_label}
        </label>
        {edited && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Editado
          </span>
        )}
      </div>

      <Textarea
        id={inputId}
        value={value}
        readOnly={readOnly}
        rows={6}
        maxLength={10000}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[140px] leading-relaxed"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        {text.ai_rationale ? (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer select-none font-medium">
              Por qué la IA escribió esto
            </summary>
            <p className="mt-1.5 whitespace-pre-line">{text.ai_rationale}</p>
          </details>
        ) : (
          <span />
        )}
        {canRestore && (
          <Button type="button" size="sm" variant="outline" onClick={onRestore}>
            <LuRotateCcw /> Restaurar texto IA
          </Button>
        )}
      </div>
    </section>
  )
}
