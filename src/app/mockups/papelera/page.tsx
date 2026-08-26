'use client'

import { useState } from 'react'
import {
  LuArchive as Archive,
  LuChevronLeft as ChevronLeft,
  LuCircleAlert as CircleAlert,
  LuRotateCcw as RotateCcw,
  LuTrash2 as Trash2,
  LuTriangleAlert as TriangleAlert,
  LuUserPlus as UserPlus,
  LuX as X,
} from 'react-icons/lu'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PLATFORM_BADGE_CLASS, PLATFORM_LABEL, type Platform } from '@/lib/paid-media/types'

// Papelera draft for slice (d): soft delete, restore, and the two messages the
// flow needs (moved-to-trash confirmation, duplicate `act_` id refusal).
//
// The purge window is 45 days (design D6). Accounts that already have reports
// are never purged, because `reports_account_id_fkey` has no ON DELETE action
// and would block the row from ever being removed — the UI states that as
// "Se conserva" instead of running a countdown that would never fire.

const PURGE_WINDOW_DAYS = 45

// Row action styling is lifted verbatim from `ReportRowActions.tsx` (the
// Reintentar control): same size, same fixed width, same hover rotation. The
// papelera is a row action like any other in this app and should not invent a
// second visual language for one.
const ROW_ACTION_CLASS = 'h-8 w-34 justify-center [&:hover_svg]:rotate-180 [&_svg]:transition-transform'

// Below `sm` the table becomes a card list, exactly like `ReportHistory` /
// `ReportCard`. `sm` is the breakpoint the rest of the app already splits on —
// ReportSheet, TaskCard and ReportesTopbar all use it. The card variant of the
// action raises the control to 44px to clear the touch-target minimum that the
// 32px table variant does not need.
const CARD_ACTION_CLASS =
  'h-11 w-full justify-center [&:hover_svg]:rotate-180 [&_svg]:transition-transform'

interface TrashRow {
  id: string
  name: string
  clientName: string | null
  platform: Platform
  deletedDaysAgo: number
  /**
   * Whether the account has any generated report, not how many. The count is
   * not worth the query: what changes the behaviour is the yes/no, because a
   * single report is enough to keep the row out of the purge forever.
   */
  hasReports: boolean
}

const ROWS: TrashRow[] = [
  {
    id: 'act_174708067923340',
    name: 'Amsterdam Importador 2',
    clientName: 'Amsterdamn',
    platform: 'meta',
    deletedDaysAgo: 3,
    hasReports: false,
  },
  {
    id: 'act_998341220765114',
    name: 'LAS VICAS',
    clientName: 'Las Vicas',
    platform: 'meta',
    deletedDaysAgo: 41,
    hasReports: false,
  },
  {
    id: 'act_310255884471902',
    name: 'DECOPOINT',
    clientName: 'Decopoint',
    platform: 'google',
    deletedDaysAgo: 62,
    hasReports: true,
  },
  {
    id: 'act_486120973355281',
    name: 'MANSILLA CARD',
    clientName: 'Mansilla',
    platform: 'meta',
    deletedDaysAgo: 71,
    hasReports: false,
  },
]

function Section({
  n,
  title,
  note,
  children,
}: {
  n: string
  title: string
  note: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-12">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-[family-name:var(--font-unbounded)] text-lg font-semibold tracking-tight">
          <span className="text-muted-foreground">{n}.</span> {title}
        </h2>
        <p className="text-sm text-muted-foreground">{note}</p>
      </div>
      {children}
    </section>
  )
}

/**
 * One column, two facts: when it was deleted and how long is left. Splitting
 * them across two columns made the reader join "hace 41 días" to "quedan 4"
 * themselves, when the second is just the first subtracted from the window.
 *
 * Never color-only: the urgent state carries an icon and different words, so
 * it survives greyscale and colour blindness.
 */
function DeletedCell({ row }: { row: TrashRow }) {
  const remaining = PURGE_WINDOW_DAYS - row.deletedDaysAgo
  const expired = remaining <= 0
  const urgent = !expired && remaining <= 7
  const pct = Math.max(0, Math.min(100, (remaining / PURGE_WINDOW_DAYS) * 100))

  return (
    <div className="flex flex-col gap-1">
      <span className="tabular-nums text-foreground">hace {row.deletedDaysAgo} días</span>

      {row.hasReports ? (
        <span
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
          title="Tiene reportes generados. Las cuentas con reportes no se eliminan nunca."
        >
          <Archive className="size-3.5 shrink-0" aria-hidden />
          Se conserva
        </span>
      ) : expired ? (
        // Past the window with nothing to purge it. Until the n8n job exists
        // this is the STEADY STATE, not an edge case, so it gets real copy
        // instead of a countdown that has run into negative numbers. No bar
        // either: an empty bar would read as "almost gone", and nothing here
        // is going anywhere on its own.
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

function TrashTable({ rows }: { rows: TrashRow[] }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3 border-b border-border px-5 py-4">
        <h3 className="text-[15px] font-semibold tracking-tight">Cuentas eliminadas</h3>
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
        // No `overflow-x-auto`: six columns on a 375px viewport is a sideways
        // scroll, not a layout. Below `sm` the card list below replaces this.
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
                    <DeletedCell row={row} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline" className={ROW_ACTION_CLASS}>
                        <RotateCcw /> Restaurar
                      </Button>
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
            <TrashCard key={row.id} row={row} />
          ))}
        </ul>
      )}
    </Card>
  )
}

/**
 * One deleted account as a card, for viewports below `sm`. Mirrors
 * `ReportCard`'s container classes so the two modules read as one system.
 *
 * Three blocks: name + platform, the act_ id and client, then the deletion
 * state and the restore action.
 */
function TrashCard({ row }: { row: TrashRow }) {
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
        <DeletedCell row={row} />
      </div>

      <div className="mt-3">
        <Button size="sm" variant="outline" className={CARD_ACTION_CLASS}>
          <RotateCcw /> Restaurar
        </Button>
      </div>
    </li>
  )
}

/** Toast body, matching the shape react-toastify renders in this app. */
function ToastCard({
  tone,
  icon,
  title,
  body,
  action,
}: {
  tone: 'neutral' | 'danger'
  icon: React.ReactNode
  title: string
  body: string
  action?: string
}) {
  return (
    // `<output>` carries an implicit role="status" and a polite live region, so
    // the toast announces itself without stealing focus.
    <output className="flex w-full max-w-md items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-lg">
      <span className={tone === 'danger' ? 'text-destructive' : 'text-primary'} aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
        {action && (
          <Button size="sm" variant="outline" className="mt-2.5">
            {action}
          </Button>
        )}
      </div>
      <button type="button" className="text-muted-foreground hover:text-foreground" aria-label="Cerrar">
        <X className="size-4" />
      </button>
    </output>
  )
}

export default function PapeleraMockup() {
  const [showEmpty, setShowEmpty] = useState(false)

  return (
    <>
      <div className="mb-10">
        <h1 className="font-[family-name:var(--font-unbounded)] text-2xl font-semibold tracking-tight">
          Papelera — Paid Media / Clientes
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Slice (d): soft delete, papelera y restaurar. Ruta propuesta:{' '}
          <code className="break-all rounded bg-secondary px-1.5 py-0.5 text-xs">
            /dashboard/paid-media/clientes/papelera
          </code>
          , anidada bajo Clientes para heredar el guard por prefijo y la misma section key.
        </p>
      </div>

      <Section
        n="1"
        title="Entrada desde Clientes"
        note="Botón secundario a la izquierda de la acción primaria"
      >
        <Card className="gap-0 overflow-hidden py-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-3 border-b border-border px-5 py-4">
            <h3 className="text-[15px] font-semibold tracking-tight">Clientes</h3>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="ghost">
                <Trash2 className="size-3.5" /> Papelera
                <span className="ml-1 rounded bg-secondary px-1.5 text-xs tabular-nums">3</span>
              </Button>
              <Button size="sm">
                <UserPlus className="size-3.5" /> Nuevo cliente
              </Button>
            </div>
          </div>
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">…tabla de clientes…</p>
        </Card>
      </Section>

      <Section n="2" title="La pantalla de papelera" note="Tres estados de purga en una sola vista">
        <div className="mb-3 flex items-center gap-2">
          <Button size="sm" variant="ghost" className="-ml-2 text-muted-foreground">
            <ChevronLeft className="size-4" /> Clientes
          </Button>
        </div>
        <div className="mb-4 flex items-center gap-2">
          <Button size="sm" variant={showEmpty ? 'outline' : 'default'} onClick={() => setShowEmpty(false)}>
            Con contenido
          </Button>
          <Button size="sm" variant={showEmpty ? 'default' : 'outline'} onClick={() => setShowEmpty(true)}>
            Vacía
          </Button>
        </div>
        <TrashTable rows={showEmpty ? [] : ROWS} />
      </Section>

      <Section n="3" title="Al eliminar una cuenta" note="Confirmación + deshacer inmediato">
        <div className="flex flex-col gap-4">
          <ToastCard
            tone="neutral"
            icon={<Trash2 className="size-5" />}
            title="LAS VICAS se movió a la papelera"
            body={`Se eliminará definitivamente en ${PURGE_WINDOW_DAYS} días. Podés restaurarla desde la papelera.`}
            action="Deshacer"
          />
          <p className="max-w-2xl text-sm text-muted-foreground">
            La eliminación se confirma con un modal antes de ejecutarse (acción destructiva), y el toast que
            sigue deja el camino de vuelta abierto. Duración larga a propósito: 3 segundos no alcanzan para
            leer y decidir.
          </p>
        </div>
      </Section>

      <Section
        n="4"
        title="Alta con un act_ que ya existe"
        note="Dos causas distintas, dos mensajes distintos"
      >
        <div className="flex flex-col gap-4">
          <ToastCard
            tone="danger"
            icon={<CircleAlert className="size-5" />}
            title="Esa cuenta ya existe"
            body="act_998341220765114 pertenece a LAS VICAS, que está en la papelera. Si es la cuenta que querías cargar, podés restaurarla desde ahí."
            action="Ir a la papelera"
          />
          <ToastCard
            tone="danger"
            icon={<CircleAlert className="size-5" />}
            title="Esa cuenta ya existe"
            body="act_310255884471902 ya está cargada como DECOPOINT."
          />
          <p className="max-w-2xl text-sm text-muted-foreground">
            El PK es el <code className="rounded bg-secondary px-1 py-0.5 text-xs">act_</code> id, así que las
            dos causas llegan como el mismo <code className="rounded bg-secondary px-1 py-0.5 text-xs">23505</code>.
            Sin distinguirlas, Ivo recibe un error sobre una fila que no puede ver. La consulta que las separa
            corre solo en la rama de error, no en el alta normal.
          </p>
        </div>
      </Section>
    </>
  )
}
