'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import {
  renderReportAction,
  saveReportTextAction,
  type ReportActionError,
} from '@/app/actions/report-actions'
import { Button } from '@/components/ui/button'
import { useJobPolling } from '@/hooks/useJobPolling'
import { periodLabel } from '@/lib/reportes/format'
import type { Report, ReportText } from '@/lib/reportes/types'
import { GenerationBlocker } from './GenerationBlocker'
import { RenderResultModal } from './RenderResultModal'
import { ReportEditorHeader, type SaveState } from './ReportEditorHeader'
import { ReportRenderHistory, type RenderHistoryItem } from './ReportRenderHistory'
import { ReportTextSection } from './ReportTextSection'

const SAVE_DEBOUNCE_MS = 800
const RENDER_TTL_MS = 180_000
const isActive = (r: RenderHistoryItem) => r.status === 'pending' || r.status === 'running'

interface RenderPollRow {
  report_url: string | null
  pdf_url: string | null
}

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
  initialRenders: RenderHistoryItem[]
  /** `reports.report_data`, for the rationale metric chips. */
  reportData?: unknown
}

/**
 * Container for the draft editor. Each section keeps its own 800ms debounce so
 * typing in one never delays another; the header aggregates them into a single
 * save state. Texts equal to the AI text are saved as `null` (not "edited").
 */
export function ReportEditorView({ report, initialTexts, versions, initialRenders, reportData }: Props) {
  const editable = report.status === 'draft_ready'
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialTexts.map((t) => [t.id, t.edited_text ?? t.ai_text])),
  )
  const [edited, setEdited] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initialTexts.map((t) => [t.id, t.edited_text !== null])),
  )
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [renders, setRenders] = useState(initialRenders)
  const [starting, setStarting] = useState(false)
  // Render being polled; resumes one that was already active on page load.
  const [pollId, setPollId] = useState<string | null>(
    () => initialRenders.find(isActive)?.id ?? null,
  )
  const [result, setResult] = useState<RenderPollRow | null>(null)
  // Locked from the DB state of the renders, so it also holds after a poll timeout.
  const rendering = starting || renders.some(isActive)

  // Only render what is already saved: the render snapshots the DB texts.
  const renderDisabled = !editable || rendering || (saveState !== 'idle' && saveState !== 'saved')

  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const inflight = useRef(0)
  const failed = useRef(false)
  // Latest value per section, so a flush on unmount sends what is in the textarea.
  const latest = useRef<Record<string, string>>(values)

  const persist = useCallback(async (text: ReportText, value: string): Promise<boolean> => {
    const next = value.trim() === '' || value === text.ai_text ? null : value
    inflight.current += 1
    setSaveState('saving')
    // A thrown action (network) must not leave the state stuck in "Guardando…".
    const res = await saveReportTextAction(text.id, next).catch(() => ({
      success: false as const,
      error: undefined,
    }))
    inflight.current -= 1

    if (!res.success) {
      failed.current = true
      setSaveState('error')
      toast.error((res.error && SAVE_ERRORS[res.error]) ?? 'No se pudo guardar el cambio')
      return false
    }
    setEdited((prev) => ({ ...prev, [text.id]: next !== null }))
    if (inflight.current === 0 && Object.keys(timers.current).length === 0) {
      setSaveState(failed.current ? 'error' : 'saved')
    }
    return true
  }, [])

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

  // Saves every pending debounce right now; false if any save failed.
  async function flushPending() {
    const saves = Object.keys(timers.current).map((id) => {
      clearTimeout(timers.current[id])
      delete timers.current[id]
      const text = initialTexts.find((t) => t.id === id)
      return text ? persist(text, latest.current[id]) : Promise.resolve(true)
    })
    return (await Promise.all(saves)).every(Boolean)
  }

  async function handleRender() {
    setStarting(true)
    try {
      if (!(await flushPending())) return
      const res = await renderReportAction(report.id).catch(() => null)
      if (!res || !res.ok) {
        toast.error(res?.message ?? 'No se pudo iniciar la generación')
        return
      }
      setRenders((prev) => [
        {
          id: res.renderId,
          public_id: res.publicId,
          status: 'pending',
          report_url: null,
          pdf_url: null,
          error: null,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
      setPollId(res.renderId)
    } finally {
      setStarting(false)
    }
  }

  const finishRender = (patch: Partial<RenderHistoryItem>) =>
    setRenders((prev) => prev.map((r) => (r.id === pollId ? { ...r, ...patch } : r)))

  useJobPolling<RenderPollRow>(
    pollId,
    {
      onDone: (row) => {
        finishRender({ status: 'done', report_url: row.report_url, pdf_url: row.pdf_url })
        setPollId(null)
        setResult(row)
      },
      onError: (message, reason) => {
        // On timeout the row is still pending in the DB: only stop watching.
        if (reason === 'job') finishRender({ status: 'error', error: message })
        setPollId(null)
        toast.error(
          reason === 'job' ? message : 'La generación tarda más de lo normal. Recargá en un rato.',
        )
      },
    },
    {
      table: 'report_renders',
      select: 'status, report_url, pdf_url, error',
      getDone: (row) => row as unknown as RenderPollRow,
      ttlMs: RENDER_TTL_MS,
    },
  )

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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 text-foreground">
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
            readOnly={!editable || rendering}
            onChange={(v) => schedule(text, v)}
            onRestore={() => schedule(text, text.ai_text)}
            reportData={reportData}
          />
        ))
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Revisaste el borrador. Al generar se congela el texto actual y se publica el reporte final.
        </p>
        <Button
          className="h-9 w-full shrink-0 text-sm font-bold sm:w-auto"
          disabled={renderDisabled}
          onClick={handleRender}
        >
          {rendering ? 'Generando…' : 'Generar reporte final'}
        </Button>
      </div>

      <ReportRenderHistory renders={renders} />

      {rendering && (
        <GenerationBlocker
          label="Generando reporte final"
          accountName={report.account_name}
          periodLabel={periodLabel(report.period_year, report.period_month)}
        />
      )}

      {result?.report_url && (
        <RenderResultModal
          accountName={report.account_name}
          periodLabel={periodLabel(report.period_year, report.period_month)}
          reportUrl={result.report_url}
          pdfUrl={result.pdf_url}
          onClose={() => setResult(null)}
        />
      )}
    </div>
  )
}
