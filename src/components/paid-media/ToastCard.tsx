'use client'

import { LuX as X } from 'react-icons/lu'
import { Button } from '@/components/ui/button'

/**
 * Opciones que van SIEMPRE con `ToastCard`, porque la card ya es el visual
 * completo: borde, fondo, radio, sombra y padding propios.
 *
 * Sin esto, la card se dibuja adentro del contenedor de react-toastify, que
 * trae lo suyo — `ClientToast.tsx` lo monta con `theme="colored"` (fondo
 * blanco) y `globals.css` le fija `--toastify-toast-padding`, radio y sombra.
 * El resultado es un marco blanco alrededor de la card: bien visible en
 * oscuro, invisible en claro (blanco sobre blanco) pero igual sumando padding
 * y una segunda sombra. Las neutralizaciones van con `!` porque compiten con
 * el CSS propio de la librería, no con otra utilidad de Tailwind.
 *
 * `pauseOnHover` se re-activa acá a propósito: el contenedor global lo tiene
 * en `false`, que está bien para un aviso de una línea, pero estos toasts
 * llevan un botón de acción y 8 segundos. Sin pausa, el toast puede irse
 * justo mientras el usuario mueve el mouse para tocarlo.
 */
export const TOAST_CARD_OPTIONS = {
  autoClose: 8000,
  closeButton: false,
  icon: false,
  hideProgressBar: true,
  pauseOnHover: true,
  className: '!bg-transparent !p-0 !min-h-0 !shadow-none',
  bodyClassName: '!m-0 !p-0',
} as const

interface Props {
  tone: 'neutral' | 'danger'
  icon: React.ReactNode
  title: string
  body: string
  actionLabel?: string
  onAction?: () => void
  onClose: () => void
}

/**
 * Presentational toast body, ported from the mockup at
 * `src/app/mockups/papelera/page.tsx`. The app's existing toasts are plain
 * strings (`toast.info`/`toast.error` in `ReportesView.tsx`); this is a
 * deliberate new pattern, rendered via react-toastify's function-child form
 * (`toast(({ closeToast }) => <ToastCard onClose={closeToast} … />)`)
 * instead, because the Deshacer action needs `closeToast` to dismiss the
 * toast itself once the undo runs.
 */
export function ToastCard({ tone, icon, title, body, actionLabel, onAction, onClose }: Props) {
  return (
    // `<output>` carries an implicit role="status" and a polite live region,
    // so the toast announces itself without stealing focus.
    <output className="flex w-full max-w-md items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-lg">
      <span className={tone === 'danger' ? 'text-destructive' : 'text-primary'} aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
        {actionLabel && onAction && (
          <Button size="sm" variant="outline" className="mt-2.5" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Cerrar"
      >
        <X className="size-4" />
      </button>
    </output>
  )
}
