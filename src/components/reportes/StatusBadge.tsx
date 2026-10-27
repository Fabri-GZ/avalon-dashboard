import { LuLoader } from 'react-icons/lu'
import type { ReportDisplayStatus } from '@/lib/reportes/types'

/**
 * One `--status-*` token per state drives the label text, the dot, the badge
 * background and the ring. Deriving all four from the same variable is the
 * point: with the previous raw palette classes
 * (`text-amber-700` + `bg-amber-500/10` + `ring-amber-500/20`) each part was an
 * independent literal, so a colour change had to be made in three places and
 * silently drifted when it wasn't.
 *
 * `color-mix` percentages come from the design: 12% for the fill, 28% for the
 * ring.
 */
const STATUS: Record<ReportDisplayStatus | 'none', { label: string; token: string; spin?: boolean }> = {
  pending: { label: 'En cola', token: 'var(--status-pending)' },
  running: { label: 'Generando…', token: 'var(--status-running)', spin: true },
  draft_ready: { label: 'Borrador listo', token: 'var(--status-draft)' },
  done: { label: 'Listo', token: 'var(--status-done)' },
  // Sent is a further success step of `done`, so it shares the success token.
  sent: { label: 'Enviado', token: 'var(--status-done)' },
  error: { label: 'Error', token: 'var(--status-error)' },
  // Absence of a report is not a status the pipeline can emit, so it has no
  // --status-* token: it stays on the neutral muted colour on purpose.
  none: { label: 'Sin reporte', token: 'var(--muted-foreground)' },
}

export function StatusBadge({ status }: { status: ReportDisplayStatus | 'none' }) {
  const { label, token, spin } = STATUS[status]

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1"
      style={{
        color: token,
        backgroundColor: `color-mix(in oklab, ${token} 12%, transparent)`,
        // Tailwind's ring utility paints from --tw-ring-color, so the ring colour
        // has to be set through that variable rather than `borderColor`.
        ['--tw-ring-color' as string]: `color-mix(in oklab, ${token} 28%, transparent)`,
      }}
    >
      {spin ? (
        <LuLoader className="h-3 w-3 animate-spin" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: token }} />
      )}
      {label}
    </span>
  )
}
