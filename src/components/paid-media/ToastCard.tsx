'use client'

import { LuX as X } from 'react-icons/lu'
import { Button } from '@/components/ui/button'

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
