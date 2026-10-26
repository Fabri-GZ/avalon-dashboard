'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { saveReportTextAction, type ReportActionError } from '@/app/actions/report-actions'
import type { Report, ReportText } from '@/lib/reportes/types'
import { ReportEditorHeader, type SaveState } from './ReportEditorHeader'
import { ReportTextSection } from './ReportTextSection'

const SAVE_DEBOUNCE_MS = 800

const SAVE_ERRORS: Partial<Record<ReportActionError, string>> = {
  not_editable: 'Este borrador ya no se puede editar',
  not_found: 'No se encontró la sección. Recargá la página',
  invalid_value: 'El texto es demasiado largo (máximo 10.000 caracteres)',
  unauthorized: 'No tenés permisos para editar este reporte',
}

interface Props {
  report: Pick<
    Report,
    'id' | 'account_name' | 'period_year' | 'period_month' | 'version' | 'status'
  >
  initialTexts: ReportText[]
  versions: { id: string; version: number }[]
}

/**
 * Container for the draft editor. Each section keeps its own 800ms debounce so
 * typing in one never delays another; the header aggregates them into a single
 * save state. Texts equal to the AI text are saved as `null` (not "edited").
 */
export function ReportEditorView({ report, initialTexts, versions }: Props) {
  const editable = report.status === 'draft_ready'
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialTexts.map((t) => [t.id, t.edited_text ?? t.ai_text])),
  )
  const [edited, setEdited] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initialTexts.map((t) => [t.id, t.edited_text !== null])),
  )
  const [saveState, setSaveState] = useState<SaveState>('idle')

  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const inflight = useRef(0)
  const failed = useRef(false)
  // Latest value per section, so a flush on unmount sends what is in the textarea.
  const latest = useRef<Record<string, string>>(values)

  const persist = useCallback(
    async (text: ReportText, value: string) => {
      const next = value.trim() === '' || value === text.ai_text ? null : value
      inflight.current += 1
      setSaveState('saving')
      const res = await saveReportTextAction(text.id, next)
      inflight.current -= 1

      if (!res.success) {
        failed.current = true
        setSaveState('error')
        toast.error((res.error && SAVE_ERRORS[res.error]) ?? 'No se pudo guardar el cambio')
        return
      }
      setEdited((prev) => ({ ...prev, [text.id]: next !== null }))
      if (inflight.current === 0 && Object.keys(timers.current).length === 0) {
        setSaveState(failed.current ? 'error' : 'saved')
      }
    },
    [],
  )

  function schedule(text: ReportText, value: string) {
    latest.current[text.id] = value
    setValues((prev) => ({ ...prev, [text.id]: value }))
    failed.current = false
    setSaveState('dirty')

    clearTimeout(timers.current[text.id])
    timers.current[text.id] = setTimeout(() => {
      delete timers.current[text.id]
      void persist(text, value)
    }, SAVE_DEBOUNCE_MS)
  }

  // Leaving the page with a pending debounce must not drop the edit.
  useEffect(() => {
    const pending = timers.current
    const texts = initialTexts
    const values = latest
    return () => {
      for (const [id, timer] of Object.entries(pending)) {
        clearTimeout(timer)
        const text = texts.find((t) => t.id === id)
        if (text) void persist(text, values.current[id])
      }
    }
  }, [initialTexts, persist])

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <ReportEditorHeader
        accountName={report.account_name}
        year={report.period_year}
        month={report.period_month}
        version={report.version}
        versions={versions}
        currentId={report.id}
        editable={editable}
        saveState={saveState}
      />

      {initialTexts.length === 0 ? (
        <p className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          Este borrador todavía no tiene secciones de texto.
        </p>
      ) : (
        initialTexts.map((text) => (
          <ReportTextSection
            key={text.id}
            text={text}
            value={values[text.id] ?? text.ai_text}
            edited={edited[text.id] ?? false}
            readOnly={!editable}
            onChange={(v) => schedule(text, v)}
            onRestore={() => schedule(text, text.ai_text)}
          />
        ))
      )}
    </div>
  )
}
