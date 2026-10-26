import Link from 'next/link'
import { LuArrowLeft } from 'react-icons/lu'
import { periodLabel } from '@/lib/reportes/format'

export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

const SAVE_LABEL: Record<SaveState, string> = {
  idle: '',
  dirty: 'Cambios sin guardar…',
  saving: 'Guardando…',
  saved: 'Guardado',
  error: 'No se pudo guardar',
}

interface Props {
  accountName: string
  year: number
  month: number
  version: number
  versions: { id: string; version: number }[]
  currentId: string
  editable: boolean
  saveState: SaveState
}

export function ReportEditorHeader({
  accountName,
  year,
  month,
  version,
  versions,
  currentId,
  editable,
  saveState,
}: Props) {
  const others = versions.filter((v) => v.id !== currentId)

  return (
    <header className="space-y-3">
      <Link
        href="/dashboard/reportes"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <LuArrowLeft className="h-3.5 w-3.5" /> Volver a reportes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold leading-snug">{accountName}</h1>
          <p className="text-sm text-muted-foreground">
            {periodLabel(year, month)} · Versión {version}
          </p>
        </div>
        <p
          role="status"
          aria-live="polite"
          className={`text-xs ${saveState === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          {editable ? SAVE_LABEL[saveState] : ''}
        </p>
      </div>

      {!editable && (
        <p className="rounded-lg bg-secondary px-3 py-2.5 text-[11.5px] text-muted-foreground">
          Este borrador no se puede editar en su estado actual.
        </p>
      )}

      {others.length > 0 && (
        <nav aria-label="Otras versiones" className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Otras versiones de este período:</span>
          {others.map((v) => (
            <Link
              key={v.id}
              href={`/dashboard/reportes/${v.id}`}
              className="rounded-full border border-border px-2.5 py-0.5 font-medium transition-colors hover:bg-muted"
            >
              v{v.version}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
