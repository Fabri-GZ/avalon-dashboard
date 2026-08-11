'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { LuX as X } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface Props {
  kind: 'done' | 'error'
  accountName: string
  periodLabel: string
  reportUrl?: string | null
  message?: string | null
  onRetry?: () => void
  onClose: () => void
}

const TITLE_ID = 'generation-result-title'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Diálogo del resultado terminal (ADR-7/ADR-8). A diferencia del blocker,
 * ESTE sí es un diálogo: el job ya terminó y su resultado quedó persistido
 * en la fila de la tabla detrás del modal, así que Escape, click en el
 * backdrop y "Cerrar" son la misma acción y ninguno de los tres pierde nada.
 *
 * `z-[90]` a propósito: tiene que superar a `ReportSheet` (`z-[60]`), sus
 * popovers de Radix (`z-[70]`) y al blocker (`z-[80]`) — un sheet que quedó
 * abierto no puede tapar nunca un resultado terminal.
 */
export function GenerationResultModal({
  kind,
  accountName,
  periodLabel,
  reportUrl,
  message,
  onRetry,
  onClose,
}: Props) {
  const [isClosing, setIsClosing] = useState(false)
  // Se calcula una sola vez al montar: este componente sólo existe del lado
  // del cliente (se renderiza condicionalmente cuando hay un resultado), así
  // que leer `matchMedia` acá es seguro, igual que `ReportSheet` toca
  // `document` directamente.
  const [reducedMotion] = useState(prefersReducedMotion)
  const { containerRef, trapTab } = useFocusTrap<HTMLDivElement>()

  function handleClose() {
    // Con reduced motion no hay animación de salida que esperar: si
    // dependiéramos de `onAnimationEnd` acá el modal jamás se cerraría,
    // porque ese evento no dispara cuando la animación está deshabilitada.
    if (reducedMotion) {
      onClose()
      return
    }
    setIsClosing(true)
  }

  useEffect(() => {
    // Inlined instead of calling `handleClose` so the effect's dependency
    // list only needs the two primitives it actually reads.
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (reducedMotion) {
        onClose()
      } else {
        setIsClosing(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [reducedMotion, onClose])

  const title = kind === 'done' ? 'Reporte listo' : 'No se pudo generar'
  const subtitle = `${accountName} · ${periodLabel}`

  return createPortal(
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4 ${
        !reducedMotion && isClosing ? 'animate-backdrop-out' : ''
      }`}
      onClick={handleClose}
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
        onAnimationEnd={!reducedMotion && isClosing ? onClose : undefined}
      >
        <div className="flex items-start justify-between border-b border-border px-5 pt-4 pb-3">
          <div>
            <h2 id={TITLE_ID} className="text-base font-semibold leading-snug">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <button
            onClick={handleClose}
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
            aria-label="Cerrar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {kind === 'error' && message && (
            <p className="rounded-lg bg-secondary px-3 py-2.5 text-[11.5px] text-muted-foreground">
              {message}
            </p>
          )}

          <div className="flex gap-2.5">
            {kind === 'done' ? (
              <Button asChild data-autofocus className="h-10 flex-1 text-sm font-bold">
                <a href={reportUrl ?? undefined} target="_blank" rel="noopener noreferrer">
                  Ver reporte
                </a>
              </Button>
            ) : (
              <Button data-autofocus className="h-10 flex-1 text-sm font-bold" onClick={onRetry}>
                Reintentar
              </Button>
            )}
            <Button variant="outline" className="h-10 flex-1 text-sm font-bold" onClick={handleClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
