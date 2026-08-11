'use client'

import { useEffect, useRef } from 'react'

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

// Trigger de "Generar reporte" en `ReportesView` (cableado en la slice 6b).
// Si el elemento que tenía foco al abrir el modal ya no está en el DOM, el
// foco vuelve acá en vez de perderse en el <body>.
const FALLBACK_TRIGGER_ID = 'reportes-generate-trigger'

/**
 * Trap de Tab + foco inicial + restauración de foco para un diálogo
 * portalado. Levantado de `ReportSheet.tsx` (selector `FOCUSABLE`, `trapTab`,
 * foco inicial en `[data-autofocus]`), con un agregado que `ReportSheet` no
 * tiene: la restauración. `ReportSheet` siempre lo cierra quien lo abrió,
 * pero el modal de resultado también puede aparecer por un job que arrancó
 * otro operador — en ese caso ningún elemento de esta pestaña lo disparó, de
 * ahí el fallback al trigger de "Generar reporte".
 */
export function useFocusTrap<T extends HTMLElement>() {
  const containerRef = useRef<T>(null)

  // Foco inicial: el elemento marcado data-autofocus (la acción primaria) o,
  // si no hay, el primer focusable del contenedor.
  useEffect(() => {
    const node = containerRef.current
    const target =
      node?.querySelector<HTMLElement>('[data-autofocus]') ??
      node?.querySelector<HTMLElement>(FOCUSABLE)
    target?.focus()
  }, [])

  // Restauración al desmontar: vuelve a quien tenía el foco antes de que el
  // diálogo apareciera. Si ese elemento ya no está conectado al DOM, cae al
  // trigger de generación de esta pestaña; si tampoco existe, no hace nada.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    return () => {
      if (previouslyFocused && document.body.contains(previouslyFocused)) {
        previouslyFocused.focus()
        return
      }
      document.getElementById(FALLBACK_TRIGGER_ID)?.focus()
    }
  }, [])

  // Trap de Tab: el foco no se va a los controles de la página de atrás.
  function trapTab(e: React.KeyboardEvent) {
    if (e.key !== 'Tab') return
    const node = containerRef.current
    if (!node) return
    const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
    )
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return { containerRef, trapTab }
}
