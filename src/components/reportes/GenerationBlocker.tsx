'use client'

import { createPortal } from 'react-dom'
import { LuLoader } from 'react-icons/lu'

interface Props {
  accountName: string
  periodLabel: string
}

/**
 * Overlay de estado mientras un reporte se genera. NO es un diálogo
 * (ADR-8): el job corre server-side pase lo que pase en esta pestaña, así
 * que no hay nada que "escapar" — el bloqueo real está en que los triggers
 * de generar/reintentar quedan `disabled` en el llamador, no acá. Por eso
 * `role="status"` en vez de `role="dialog"`, sin `aria-modal`, sin trap de
 * foco y sin affordance de cierre.
 *
 * El texto del live region es estático a propósito: ningún contador de
 * tiempo ni texto que cambie con cada poll puede vivir adentro, porque un
 * live region que se actualiza cada 3s convierte al lector de pantalla en
 * un metrónomo. El ícono es puramente decorativo (`aria-hidden`).
 */
export function GenerationBlocker({ accountName, periodLabel }: Props) {
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-lg"
      >
        <LuLoader aria-hidden className="size-5 shrink-0 animate-spin text-primary motion-reduce:animate-none" />
        <p className="text-sm font-medium text-foreground">
          Generando reporte: {accountName} · {periodLabel}
        </p>
      </div>
    </div>,
    document.body,
  )
}
