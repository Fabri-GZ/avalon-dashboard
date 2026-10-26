'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { generatedAt, periodLabel } from '@/lib/reportes/format'
import type { SendVersion } from '@/lib/reportes/renders'

interface Props {
  clientName: string
  year: number
  month: number
  /** Sendable versions of the period, newest first. The first is preselected. */
  versions: SendVersion[]
  /** Fixed recipients from the client form. `null` blocks the send. */
  to: string | null
  cc: string[]
  /** Deliveries already sent for this account+period (drives the warning and the file suffix). */
  priorSentCount: number
  sending?: boolean
  error?: string | null
  onConfirm: (renderId: string) => void
  onCancel: () => void
}

const TITLE_ID = 'send-report-title'

/**
 * Confirmation before emailing a finished report to the client. Presentational:
 * the container owns the send request and passes `sending` / `error` back.
 *
 * Recipients are read-only on purpose (decision D6): they are edited only in the
 * client form, so a typo can never happen at send time. Cancel, Escape and the
 * backdrop are the same no-op — nothing is created until the user confirms.
 *
 * The file name mirrors the rule the server applies: `Reporte {Cliente} - {Mes}
 * {Año}.pdf`, plus ` (vN)` from the second send of the same period on.
 */
export function SendReportModal({
  clientName,
  year,
  month,
  versions,
  to,
  cc,
  priorSentCount,
  sending = false,
  error = null,
  onConfirm,
  onCancel,
}: Props) {
  const { containerRef, trapTab } = useFocusTrap<HTMLDivElement>()
  const [renderId, setRenderId] = useState(versions[0]?.renderId ?? '')

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !sending) onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel, sending])

  const attempt = priorSentCount + 1
  const fileName = `Reporte ${clientName} - ${periodLabel(year, month)}${attempt > 1 ? ` (v${attempt})` : ''}.pdf`
  const canSend = Boolean(to) && Boolean(renderId) && !sending

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
      onClick={sending ? undefined : onCancel}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className="animate-sheet-fade w-full max-w-[460px] rounded-xl bg-card text-card-foreground shadow-lg"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={trapTab}
      >
        <div className="border-b border-border px-5 pt-4 pb-3">
          <h2 id={TITLE_ID} className="text-base font-semibold leading-snug">
            Enviar reporte al cliente
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {clientName} · {periodLabel(year, month)}
          </p>
        </div>

        <div className="space-y-4 px-5 py-4">
          {!to && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2.5 text-[11.5px] text-destructive">
              El cliente no tiene mail para reportes. Cargalo en{' '}
              <Link href="/dashboard/paid-media/clientes" className="font-semibold underline">
                Paid Media &gt; Clientes
              </Link>
              .
            </p>
          )}

          {priorSentCount > 0 && (
            <p className="rounded-lg bg-secondary px-3 py-2.5 text-[11.5px] text-muted-foreground">
              Este período ya se envió {priorSentCount === 1 ? '1 vez' : `${priorSentCount} veces`}. Si
              continuás, el cliente recibe otro mail y el archivo se guarda como una versión nueva.
            </p>
          )}

          <Field label="Versión">
            {versions.length > 1 ? (
              <Select value={renderId} onValueChange={setRenderId} disabled={sending}>
                <SelectTrigger className="w-full" aria-label="Versión a enviar">
                  <SelectValue />
                </SelectTrigger>
                {/* Above the modal (z-[90]): the portal'd list would sit under it. */}
                <SelectContent position="popper" className="z-[100]">
                  {versions.map((v) => (
                    <SelectItem key={v.renderId} value={v.renderId}>
                      v{v.version} · generada {generatedAt(v.renderedAt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm">
                v{versions[0]?.version} · generada {versions[0] ? generatedAt(versions[0].renderedAt) : '—'}
              </p>
            )}
          </Field>

          <Field label="Para">
            <p className="break-all text-sm">{to ?? '—'}</p>
          </Field>

          <Field label="CC">
            <p className="break-all text-sm">{cc.length > 0 ? cc.join(', ') : 'Sin copias'}</p>
          </Field>

          <Field label="Nombre del archivo">
            <p className="break-words text-sm">{fileName}</p>
          </Field>

          {error && (
            <p role="alert" className="text-[11.5px] text-destructive">
              {error}
            </p>
          )}

          <div className="flex gap-2.5">
            <Button
              data-autofocus
              className="h-10 flex-1 text-sm font-bold"
              disabled={!canSend}
              onClick={() => onConfirm(renderId)}
            >
              {sending ? 'Enviando…' : 'Enviar'}
            </Button>
            <Button
              variant="outline"
              className="h-10 flex-1 text-sm font-bold"
              disabled={sending}
              onClick={onCancel}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  )
}
