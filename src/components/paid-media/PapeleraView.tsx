'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  LuArchive as Archive,
  LuChevronLeft as ChevronLeft,
  LuRotateCcw as RotateCcw,
  LuTrash2 as Trash2,
  LuTriangleAlert as TriangleAlert,
} from 'react-icons/lu'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { restoreAccountAction } from '@/app/actions/paid-media-actions'
import { PLATFORM_BADGE_CLASS, PLATFORM_LABEL } from '@/lib/paid-media/types'
import type { AccountsWithReports } from '@/lib/paid-media/reports-presence'
import type { TrashRow } from '@/app/dashboard/paid-media/clientes/papelera/page'

// Ports the mockup at `src/app/mockups/papelera/page.tsx` into production
// components. The mockup route stays untouched as a design sandbox — this
// file does not import from it.

const PURGE_WINDOW_DAYS = 45

// Row action styling lifted verbatim from `ReportRowActions.tsx` (the
// Reintentar control): same size, same fixed width, same hover rotation.
const ROW_ACTION_CLASS = 'h-8 w-34 justify-center [&:hover_svg]:rotate-180 [&_svg]:transition-transform'

// Below `sm` the table becomes a card list, mirroring `ReportHistory` /
// `ReportCard`. The card variant raises the control to 44px for the
// touch-target minimum the 32px table variant does not need.
const CARD_ACTION_CLASS = 'h-11 w-full justify-center [&:hover_svg]:rotate-180 [&_svg]:transition-transform'

interface Props {
  rows: TrashRow[]
  /** Optional, removable layer — see `reports-presence.ts`. */
  accountsWithReports?: AccountsWithReports
}

/**
 * One column, two facts: when it was deleted and how long is left. Never
 * color-only: the urgent state carries an icon and different words, so it
 * survives greyscale and colour blindness. Past the window, there is no
 * purge job (out of scope, runs in n8n), so the clamped "Pendiente de
 * eliminación definitiva" state is the steady state, not an edge case.
 */
function DeletedCell({ row, hasReports }: { row: TrashRow; hasReports: boolean }) {
  const remaining = PURGE_WINDOW_DAYS - row.deletedDaysAgo
  const expired = remaining <= 0
  const urgent = !expired && remaining <= 7
  const pct = Math.max(0, Math.min(100, (remaining / PURGE_WINDOW_DAYS) * 100))

  return (
    <div className="flex flex-col gap-1">
      <span className="tabular-nums text-foreground">hace {row.deletedDaysAgo} días</span>

      {hasReports ? (
        <span
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
          title="Tiene reportes generados. Las cuentas con reportes no se eliminan nunca."
        >
          <Archive className="size-3.5 shrink-0" aria-hidden />
          Se conserva
        </span>
      ) : expired ? (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
          Pendiente de eliminación definitiva
        </span>
      ) : (
        <>
          <span
            className={`flex items-center gap-1.5 text-xs ${urgent ? 'font-medium text-destructive' : 'text-muted-foreground'}`}
          >
            {urgent && <TriangleAlert className="size-3.5 shrink-0" aria-hidden />}
            <span className="tabular-nums">
              {urgent ? 'Se elimina en ' : 'Quedan '}
              {remaining} {remaining === 1 ? 'día' : 'días'}
            </span>
          </span>
          <div className="h-1 w-24 overflow-hidden rounded-full bg-secondary" aria-hidden>
            <div
              className={`h-full rounded-full ${urgent ? 'bg-destructive' : 'bg-primary/50'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      )}
    </div>
  )
}

function RestoreButton({
  row,
  className,
  pending,
  onRestore,
}: {
  row: TrashRow
  className: string
  pending: boolean
  onRestore: (id: string) => void
}) {
  return (
    <Button
      size="sm"
      variant="outline"
      className={className}
      disabled={pending}
      onClick={() => onRestore(row.id)}
    >
      <RotateCcw /> Restaurar
    </Button>
  )
}

function TrashCard({
  row,
  hasReports,
  pending,
  onRestore,
}: {
  row: TrashRow
  hasReports: boolean
  pending: boolean
  onRestore: (id: string) => void
}) {
  return (
    <li className="rounded-md border border-border bg-card px-4 py-3 shadow-sm transition-all duration-200 ease-in">
      <div className="flex items-start justify-between gap-3">
        <span className="line-clamp-2 break-words text-sm font-semibold text-foreground" title={row.name}>
          {row.name}
        </span>
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${PLATFORM_BADGE_CLASS[row.platform]}`}
        >
          {PLATFORM_LABEL[row.platform]}
        </span>
      </div>

      <p className="mt-1.5 break-all text-xs text-muted-foreground">
        {row.id}
        {row.clientName ? ` · ${row.clientName}` : ''}
      </p>

      <div className="mt-2.5 text-sm">
        <DeletedCell row={row} hasReports={hasReports} />
      </div>

      <div className="mt-3">
        <RestoreButton row={row} className={CARD_ACTION_CLASS} pending={pending} onRestore={onRestore} />
      </div>
    </li>
  )
}

export function PapeleraView({ rows, accountsWithReports }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [restoringId, setRestoringId] = useState<string | null>(null)

  function handleRestore(id: string) {
    setRestoringId(id)
    startTransition(async () => {
      await restoreAccountAction(id)
      setRestoringId(null)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="ghost" className="-ml-2 text-muted-foreground">
          <a href="/dashboard/paid-media/clientes">
            <ChevronLeft className="size-4" /> Clientes
          </a>
        </Button>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-3 border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold tracking-tight">Cuentas eliminadas</h2>
          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground tabular-nums">
            {rows.length}
          </span>
          <p className="ml-auto text-xs text-muted-foreground">
            Se eliminan definitivamente a los {PURGE_WINDOW_DAYS} días
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <Trash2 className="size-7 text-muted-foreground/50" aria-hidden />
            <p className="text-sm font-medium">La papelera está vacía</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Las cuentas que elimines van a aparecer acá durante {PURGE_WINDOW_DAYS} días, con la opción de
              restaurarlas.
            </p>
          </div>
        ) : (
          // No `overflow-x-auto`: five columns on a 375px viewport is a
          // sideways scroll, not a layout. Below `sm` the card list replaces
          // this table.
          <div className="hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="w-[26%] px-5 py-2.5 font-semibold">Cuenta</th>
                  <th className="px-5 py-2.5 font-semibold">Cliente</th>
                  <th className="px-5 py-2.5 font-semibold">Plataforma</th>
                  <th className="px-5 py-2.5 font-semibold">Eliminada</th>
                  <th className="px-5 py-2.5 font-semibold">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border/60">
                    <td className="px-5 py-3.5">
                      <span className="block font-semibold text-foreground">{row.name}</span>
                      <span className="block text-xs text-muted-foreground">{row.id}</span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{row.clientName ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${PLATFORM_BADGE_CLASS[row.platform]}`}
                      >
                        {PLATFORM_LABEL[row.platform]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      <DeletedCell row={row} hasReports={accountsWithReports?.has(row.id) ?? true} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        <RestoreButton
                          row={row}
                          className={ROW_ACTION_CLASS}
                          pending={isPending && restoringId === row.id}
                          onRestore={handleRestore}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && (
          <ul className="space-y-2.5 p-3 sm:hidden">
            {rows.map((row) => (
              <TrashCard
                key={row.id}
                row={row}
                hasReports={accountsWithReports?.has(row.id) ?? true}
                pending={isPending && restoringId === row.id}
                onRestore={handleRestore}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
