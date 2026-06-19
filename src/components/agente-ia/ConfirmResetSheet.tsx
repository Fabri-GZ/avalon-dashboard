'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmResetSheetProps {
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmResetSheet({ onConfirm, onCancel }: ConfirmResetSheetProps) {
  const [isClosing, setIsClosing] = useState(false)
  const intentRef = useRef<'confirm' | 'cancel'>('cancel')

  function triggerClose(intent: 'confirm' | 'cancel') {
    intentRef.current = intent
    setIsClosing(true)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') triggerClose('cancel')
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [])

  function handleAnimationEnd() {
    if (!isClosing) return
    if (intentRef.current === 'confirm') {
      onConfirm()
    } else {
      onCancel()
    }
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center ${
        isClosing ? 'animate-backdrop-out' : ''
      }`}
      onClick={() => triggerClose('cancel')}
    >
      <div
        className={`w-full max-w-[420px] rounded-t-2xl bg-card text-card-foreground sm:rounded-xl ${
          isClosing
            ? 'animate-sheet-down sm:animate-sheet-fade-out'
            : 'animate-sheet-up sm:animate-sheet-fade'
        }`}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={handleAnimationEnd}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-muted" />
        </div>

        <div className="flex flex-col gap-4 px-5 pt-4 pb-5">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-base font-semibold text-foreground">
              ¿Cambiar departamento?
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Cambiar el departamento iniciará una nueva conversación. Se perderá el historial actual.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => triggerClose('cancel')}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => triggerClose('confirm')}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-destructive/90"
            >
              Sí, cambiar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
