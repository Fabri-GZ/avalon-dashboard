'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-toastify'
import { LuCheck as Check, LuClipboard as Clipboard, LuX as X } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface Props {
  accountName: string
  periodLabel: string
  reportUrl: string
  pdfUrl?: string | null
  /** Opens the send flow for this render. */
  onSend: () => void
  onClose: () => void
}

const TITLE_ID = 'render-result-title'

/**
 * Result of a finished render: the published link (copyable), the PDF and the
 * entry point to the send flow, which the parent owns. Same z-index and close
 * behavior as `GenerationResultModal`.
 */
export function RenderResultModal({ accountName, periodLabel, reportUrl, pdfUrl, onSend, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const { containerRef, trapTab } = useFocusTrap<HTMLDivElement>()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(reportUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Link copiado')
    } catch {
      toast.error('No se pudo copiar el link')
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className="w-full max-w-[420px] rounded-xl bg-card text-card-foreground shadow-lg"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={trapTab}
      >
        <div className="flex items-start justify-between border-b border-border px-5 pt-4 pb-3">
          <div>
            <h2 id={TITLE_ID} className="text-base font-semibold leading-snug">
              Reporte final listo
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {accountName} · {periodLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
            aria-label="Cerrar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex items-center gap-2 rounded-lg bg-secondary py-1.5 pr-1.5 pl-3">
            <p className="min-w-0 flex-1 truncate text-[11.5px] text-muted-foreground" title={reportUrl}>
              {reportUrl}
            </p>
            <button
              type="button"
              onClick={copyLink}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Copiar link"
              title="Copiar link"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Clipboard className="h-3.5 w-3.5" />}
            </button>
          </div>

          <Button data-autofocus className="h-10 w-full text-sm font-bold" onClick={onSend}>
            Enviar al cliente
          </Button>

          <div className="flex gap-2.5">
            <Button asChild variant="outline" className="h-10 flex-1 text-sm font-bold">
              <a href={reportUrl} target="_blank" rel="noopener noreferrer">
                Ver reporte
              </a>
            </Button>
            {pdfUrl && (
              <Button asChild variant="outline" className="h-10 flex-1 text-sm font-bold">
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  Descargar PDF
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
