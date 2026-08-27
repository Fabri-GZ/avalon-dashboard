'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { LuTrash2 as Trash2 } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface Props {
  accountName: string
  /**
   * Optional, removable layer — see `reports-presence.ts`. Selects copy ONLY:
   * it must never gate the delete button, its enablement, the confirm flow,
   * or any query.
   */
  hasReports: boolean
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
}

const TITLE_ID = 'confirm-delete-title'
const PURGE_WINDOW_DAYS = 45

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Confirmation for a destructive action (deleting an account) — hand-rolled,
 * no Dialog primitive exists in this codebase. Shape lifted verbatim from
 * `GenerationResultModal.tsx`: `createPortal` + `useFocusTrap`.
 *
 * `z-[90]` a propósito: este modal se abre desde adentro de `AccountForm`,
 * que vive dentro de `SheetShell` (`z-[60]`), cuyos popovers de Radix (los
 * `Select` del propio formulario) son `z-[70]`. Comparte `z-[90]` con
 * `GenerationResultModal`, que vive en una ruta disjunta.
 */
export function ConfirmDeleteModal({ accountName, hasReports, pending, onConfirm, onCancel }: Props) {
  const [isClosing, setIsClosing] = useState(false)
  // Se calcula una sola vez al montar, igual que `GenerationResultModal`:
  // este componente sólo existe del lado del cliente.
  const [reducedMotion] = useState(prefersReducedMotion)
  const { containerRef, trapTab } = useFocusTrap<HTMLDivElement>()

  function handleCancel() {
    if (pending) return
    // Con reduced motion no hay animación de salida que esperar: si
    // dependiéramos de `onAnimationEnd` acá el modal jamás se cerraría.
    if (reducedMotion) {
      onCancel()
      return
    }
    setIsClosing(true)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape' || pending) return
      if (reducedMotion) {
        onCancel()
      } else {
        setIsClosing(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [reducedMotion, pending, onCancel])

  return createPortal(
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4 ${
        !reducedMotion && isClosing ? 'animate-backdrop-out' : ''
      }`}
      onClick={handleCancel}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className={`w-full max-w-[420px] rounded-xl bg-card text-card-foreground shadow-lg ${
          reducedMotion ? '' : isClosing ? 'animate-sheet-fade-out' : 'animate-sheet-fade'
        }`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={trapTab}
        onAnimationEnd={!reducedMotion && isClosing ? onCancel : undefined}
      >
        <div className="flex items-start gap-3 border-b border-border px-5 pt-4 pb-3">
          <span
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
            aria-hidden
          >
            <Trash2 className="h-4 w-4" />
          </span>
          <div>
            <h2 id={TITLE_ID} className="text-base font-semibold leading-snug">
              ¿Eliminar {accountName}?
            </h2>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <p className="text-[12px] text-muted-foreground">
            {hasReports
              ? `Esta cuenta tiene reportes generados: se va a conservar en la papelera en vez de eliminarse definitivamente a los ${PURGE_WINDOW_DAYS} días.`
              : `Se va a mover a la papelera. Vas a poder restaurarla mientras esté ahí, o se eliminará definitivamente a los ${PURGE_WINDOW_DAYS} días.`}
          </p>

          <div className="flex gap-2.5">
            <Button variant="outline" className="h-10 flex-1 text-sm font-bold" onClick={handleCancel} disabled={pending}>
              Cancelar
            </Button>
            <Button
              data-autofocus
              variant="destructive"
              className="h-10 flex-1 text-sm font-bold"
              onClick={onConfirm}
              disabled={pending}
            >
              {pending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
