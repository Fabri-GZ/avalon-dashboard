'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Chrome extraído de `ReportSheet.tsx` (era el único consumidor). Cubre
// portal, backdrop, Escape, scroll-lock del body, trap de Tab, foco inicial
// y las clases responsive de bottom-sheet (mobile) / modal centrado
// (desktop). Lo que NO cubre (header, título visible, cuerpo) queda a cargo
// de cada consumidor vía `children`.
//
// `children` es un render-prop (recibe `requestClose`) en vez de un nodo
// plano: es lo que permite que un botón de cierre o un submit dentro del
// contenido disparen la animación de salida en vez de desmontar de golpe.
// Ese ciclo isClosing → onAnimationEnd → onClose (desmonte diferido) es la
// parte sutil que hay que preservar exacto — es la razón de existir de este
// archivo en vez de reimplementar un segundo sheet.

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

interface SheetShellProps {
  ariaLabel: string
  onClose: () => void
  children: (requestClose: () => void) => React.ReactNode
  /** Ancho máximo en desktop. Default: igual a `ReportSheet` (460px). */
  maxWidthClassName?: string
}

export function SheetShell({
  ariaLabel,
  onClose,
  children,
  maxWidthClassName = 'sm:max-w-[460px]',
}: SheetShellProps) {
  const [isClosing, setIsClosing] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  function requestClose() {
    setIsClosing(true)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') requestClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [])

  // Foco inicial dentro del sheet (nunca el fondo).
  useEffect(() => {
    const node = sheetRef.current
    const target =
      node?.querySelector<HTMLElement>('[data-autofocus]') ??
      node?.querySelector<HTMLElement>(FOCUSABLE)
    target?.focus()
  }, [])

  // Trap de Tab: el foco no se va a los botones de la página de atrás.
  function trapTab(e: React.KeyboardEvent) {
    if (e.key !== 'Tab') return
    const node = sheetRef.current
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

  return createPortal(
    <div
      className={`fixed inset-0 z-[60] bg-black/40 sm:flex sm:items-center sm:justify-center ${
        isClosing ? 'animate-backdrop-out' : ''
      }`}
      onClick={requestClose}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={`fixed inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-t-2xl bg-card text-card-foreground
          sm:relative sm:inset-x-auto sm:bottom-auto sm:max-h-[85vh] sm:w-full ${maxWidthClassName} sm:rounded-xl
          ${isClosing ? 'animate-sheet-down sm:animate-sheet-fade-out' : 'animate-sheet-up sm:animate-sheet-fade'}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={trapTab}
        onAnimationEnd={isClosing ? onClose : undefined}
      >
        {children(requestClose)}
      </div>
    </div>,
    document.body,
  )
}
