'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface Props {
  accountName: string
  periodLabel: string
  latestVersion: number
  onConfirm: () => void
  onCancel: () => void
}

const TITLE_ID = 'regenerate-confirm-title'

/**
 * Confirmation before creating a new version of a complete report that already
 * has a draft for the same account+period. Presentational: the server decides
 * when this is needed (409 `complete_exists`); the container owns the request.
 *
 * Nothing is created until the user confirms, so Escape, backdrop click and
 * "Cancelar" are the same no-op. `z-[90]` matches GenerationResultModal so a
 * sheet left open can never cover it.
 */
export function RegenerateConfirmModal({
  accountName,
  periodLabel,
  latestVersion,
  onConfirm,
  onCancel,
}: Props) {
  const { containerRef, trapTab } = useFocusTrap<HTMLDivElement>()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className="animate-sheet-fade w-full max-w-[420px] rounded-xl bg-card text-card-foreground shadow-lg"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={trapTab}
      >
        <div className="border-b border-border px-5 pt-4 pb-3">
          <h2 id={TITLE_ID} className="text-base font-semibold leading-snug">
            Ya existe un reporte completo
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {accountName} · {periodLabel}
          </p>
        </div>

        <div className="space-y-4 px-5 py-4">
          <p className="rounded-lg bg-secondary px-3 py-2.5 text-[11.5px] text-muted-foreground">
            Ya hay un borrador de este período (última versión: v{latestVersion}). Si continuás se
            genera una versión nueva; las anteriores no se borran.
          </p>

          <div className="flex gap-2.5">
            <Button data-autofocus className="h-10 flex-1 text-sm font-bold" onClick={onConfirm}>
              Generar nueva versión
            </Button>
            <Button variant="outline" className="h-10 flex-1 text-sm font-bold" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
