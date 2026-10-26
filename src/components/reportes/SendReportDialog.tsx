'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import { sendReportAction } from '@/app/actions/report-actions'
import { useJobPolling } from '@/hooks/useJobPolling'
import type { SendContext } from '@/lib/reportes/renders'
import { SendReportModal } from './SendReportModal'

// n8n only has to create the Drive file and send the mail.
const DELIVERY_TTL_MS = 120_000

interface Props extends SendContext {
  clientName: string
  to: string | null
  cc: string[]
  /** The delivery reached `sent`: the parent records it so the resend warning is current. */
  onSent: (renderId: string, deliveryId: string) => void
  onClose: () => void
}

/**
 * Container for the send flow: calls the server action, then tracks the
 * delivery row until n8n marks it `sent` or `error`. The modal stays open (and
 * not cancellable) while it runs, so the polling is never orphaned.
 */
export function SendReportDialog({ onSent, onClose, ...target }: Props) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<{ deliveryId: string; renderId: string } | null>(null)

  useJobPolling<null>(
    pending?.deliveryId ?? null,
    {
      onDone: () => {
        if (!pending) return
        onSent(pending.renderId, pending.deliveryId)
        toast.success('Reporte enviado al cliente')
        onClose()
      },
      onError: (msg, reason) => {
        setPending(null)
        setSending(false)
        // A timeout is not a failure: the delivery row may still finish on its own.
        setError(
          reason === 'timeout'
            ? 'El envío está tardando más de lo normal. Revisá el mail y el historial antes de reintentar.'
            : `No se pudo enviar: ${msg}`,
        )
      },
    },
    {
      table: 'report_deliveries',
      select: 'status, error',
      isDone: (row) => row.status === 'sent',
      ttlMs: DELIVERY_TTL_MS,
      getDone: () => null,
      getError: (row) => (row.error as string | null) ?? null,
    },
  )

  async function handleConfirm(renderId: string) {
    if (sending || !target.to) return
    setSending(true)
    setError(null)

    let res: Awaited<ReturnType<typeof sendReportAction>>
    try {
      res = await sendReportAction({ renderId, to: target.to, cc: target.cc })
    } catch {
      setSending(false)
      setError('No se pudo conectar con el servidor')
      return
    }

    if (res.ok === false) {
      setSending(false)
      setError(res.message)
      return
    }
    setPending({ deliveryId: res.deliveryId, renderId })
  }

  return <SendReportModal {...target} sending={sending} error={error} onConfirm={handleConfirm} onCancel={onClose} />
}
