'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { LuX as X, LuPencil as Pencil, LuPlus as Plus, LuTrash2 as Trash2 } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { SheetShell } from '@/components/ui/sheet-shell'
import { AccountForm } from './AccountForm'
import { ClientForm, type SavedClient } from './ClientForm'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { ToastCard, TOAST_CARD_OPTIONS } from './ToastCard'
import { trashClientAction } from '@/app/actions/paid-media-actions'
import { formatBudget } from '@/lib/paid-media/format'
import { normalizePersonName } from '@/lib/paid-media/names'
import { isHttpUrl } from '@/lib/paid-media/url'
import type { AccountsWithReports } from '@/lib/paid-media/reports-presence'
import { PLATFORM_LABEL, PRIMARY_OBJECTIVE_OPTIONS, type AdAccountRow, type ClientGroup, type ClientOption, type ClientStatus, type FundingMethodOption, type ManagementStatus } from '@/lib/paid-media/types'

// `client-*` panels edit the client itself (`ClientForm`); `create`/`edit` are
// the account form.
type Panel =
  | { mode: 'view' }
  | { mode: 'client-create' }
  | { mode: 'client-edit' }
  | { mode: 'create' }
  | { mode: 'edit'; account: AdAccountRow }

// Cae a la clave cruda si el valor guardado no está en el catálogo: es
// exactamente el caso que el nodo `compute` marca como `unknown_action_type`,
// y verlo tal cual en pantalla es la única pista de que hay que corregirlo.
function objectiveLabel(key: string): string {
  return PRIMARY_OBJECTIVE_OPTIONS.find((o) => o.key === key)?.label ?? key
}

interface Props {
  /**
   * `null` means there is no client to view yet: "Nuevo cliente" (client form)
   * or, with `newAccount`, "Nueva cuenta" (account form, client optional).
   */
  group: ClientGroup | null
  /** Open straight on the account form with no client preselected. */
  newAccount?: boolean
  /** Called with the new client's id so the parent can start deriving `group` from fresh props. */
  onClientCreated?: (clientId: string) => void
  /** Account-level states: each account card shows its own. */
  statuses: ManagementStatus[]
  /** Client-level states: PM, operator and status belong to the client. */
  clientStatuses: ClientStatus[]
  fundingMethods: FundingMethodOption[]
  /** Full active-client set for `ClientPicker` (not narrowed by the list filters). */
  clients: ClientOption[]
  /** Valores distintos del dataset completo (sin filtrar), para `AccountForm`. */
  pmNames: string[]
  operators: string[]
  /**
   * Optional, removable layer — see `reports-presence.ts`. Pass-through only:
   * `AccountForm` does not consume this yet (wired in a later slice).
   */
  accountsWithReports?: AccountsWithReports
  onClose: () => void
  /**
   * "Asignar cliente" (unassigned-accounts table) reuses this sheet in edit
   * mode instead of view mode — jumping straight to the form, where the
   * picker sets `client_id` via `updateAccountAction`, no new Server Action.
   */
  editAccount?: AdAccountRow
}

/**
 * Side sheet built on `SheetShell`. In "view" mode it lists the client's
 * fields plus one card per account. Selecting "Editar" (or "Agregar cuenta")
 * swaps the body for `AccountForm`, still inside the same sheet — no second
 * portal/backdrop stack.
 */
export function ClientDetailSheet({
  group,
  newAccount,
  onClientCreated,
  statuses,
  clientStatuses,
  fundingMethods,
  clients,
  pmNames,
  operators,
  accountsWithReports,
  onClose,
  editAccount,
}: Props) {
  const router = useRouter()
  const [showConfirmTrash, setShowConfirmTrash] = useState(false)
  const [trashError, setTrashError] = useState<string | null>(null)
  const [trashing, startTrash] = useTransition()
  const [panel, setPanel] = useState<Panel>(
    editAccount
      ? { mode: 'edit', account: editAccount }
      : newAccount
        ? { mode: 'create' }
        : group
          ? { mode: 'view' }
          : { mode: 'client-create' },
  )
  // A client created in this session: the sheet stays open on it, but the
  // parent's `group` only arrives after `router.refresh()`. Until then this
  // stands in (name + empty state); once `group` exists it always wins.
  const [created, setCreated] = useState<SavedClient | null>(null)
  const view: ClientGroup | null =
    group ??
    (created
      ? {
          clientId: created.clientId,
          clientName: created.clientName,
          portalEnabled: false,
          status: created.status,
          websiteUrl: created.websiteUrl,
          instagramUrl: created.instagramUrl,
          accounts: [],
          platforms: [],
          pmName: created.pmName,
          operatorName: created.operatorName,
          budgetByCurrency: [],
        }
      : null)

  const statusLabel = useMemo(() => {
    const map = new Map(statuses.map((s) => [s.key, s.label]))
    return (key: string | null) => (key ? (map.get(key) ?? key) : null)
  }, [statuses])

  const clientStatusLabel = useMemo(() => {
    const map = new Map(clientStatuses.map((s) => [s.key, s.label]))
    return (key: string | null) => (key ? (map.get(key) ?? key) : null)
  }, [clientStatuses])

  const fundingLabel = useMemo(() => {
    const map = new Map(fundingMethods.map((f) => [f.key, f.label]))
    return (key: string | null) => (key ? (map.get(key) ?? key) : null)
  }, [fundingMethods])

  const ariaLabel = editAccount
    ? `Asignar cliente — ${editAccount.name}`
    : view && panel.mode !== 'client-create'
      ? view.clientName
      : panel.mode === 'client-create'
        ? 'Nuevo cliente'
        : 'Nueva cuenta'

  const eyebrow = editAccount
    ? 'Asignar cliente'
    : panel.mode === 'client-create'
      ? 'Nuevo cliente'
      : panel.mode === 'client-edit'
        ? 'Editar cliente'
        : panel.mode === 'create'
          ? 'Nueva cuenta'
          : panel.mode === 'edit'
            ? 'Editar cuenta'
            : 'Cliente'

  function handleClientSaved(saved: SavedClient) {
    router.refresh()
    // Unlike an account save, the sheet stays open on the client so accounts
    // can be added right away.
    if (panel.mode === 'client-create') {
      setCreated(saved)
      onClientCreated?.(saved.clientId)
    } else if (!group && created?.clientId === saved.clientId) {
      // Editing the stand-in itself (no `group` yet, or hidden by a filter):
      // keep it in sync so the view does not show the pre-edit values.
      setCreated(saved)
    }
    setPanel({ mode: 'view' })
  }

  function handleTrashClient(clientId: string, clientName: string, requestClose: () => void) {
    setTrashError(null)
    startTrash(async () => {
      const result = await trashClientAction(clientId)
      setShowConfirmTrash(false)
      if (!result.success) {
        setTrashError(
          result.error === 'not_found'
            ? 'El cliente ya no existe o ya estaba en la papelera.'
            : result.error === 'unauthorized'
              ? 'No tenés permisos para hacer esta acción.'
              : 'Ocurrió un error inesperado. Probá de nuevo.',
        )
        return
      }
      toast(
        ({ closeToast }) => (
          <ToastCard
            tone="neutral"
            icon={<Trash2 className="size-5" />}
            title={`${clientName} se movió a la papelera`}
            body="Sus cuentas se movieron con él. Podés restaurarlo desde la papelera."
            onClose={closeToast}
          />
        ),
        TOAST_CARD_OPTIONS,
      )
      router.refresh()
      requestClose()
    })
  }

  function handleSaved(requestClose: () => void) {
    router.refresh()
    // Data comes from server props; the simplest correct behavior after a
    // save is to close and let the refreshed list/detail be reopened, rather
    // than trying to reconcile a stale `group` object client-side.
    setPanel({ mode: 'view' })
    requestClose()
  }

  return (
    // Más ancho en desktop: el cuerpo muestra los datos del cliente más una
    // tarjeta por cuenta con hasta ocho campos, y a 560px las URLs y las notas
    // se truncaban casi siempre. Debajo de `sm` no cambia nada: sigue siendo
    // un bottom sheet a ancho completo.
    <SheetShell
      ariaLabel={ariaLabel}
      onClose={onClose}
      maxWidthClassName="sm:max-w-[820px]"
      // The dialog div is the scroll container (`overflow-y-auto`). A taller
      // desktop minimum leaves room for the absolutely positioned combobox
      // list; `min()` keeps it within the 85vh cap on short screens.
      extraClassName="sm:min-h-[min(780px,85vh)]"
    >
      {(requestClose) => (
        <>
          <div className="sticky top-0 flex justify-center bg-card pt-3 pb-1 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-muted" />
          </div>

          <div className="flex items-start justify-between border-b border-border px-5 pt-4 pb-3">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {eyebrow}
              </p>
              <h2 className="text-base font-semibold leading-snug">{ariaLabel}</h2>
            </div>
            <button
              onClick={requestClose}
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
              aria-label="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {panel.mode === 'view' && view && (
            <div className="space-y-4 px-5 py-4">
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive dark:hover:border-destructive/50 dark:hover:bg-destructive/10"
                  onClick={() => {
                    setTrashError(null)
                    setShowConfirmTrash(true)
                  }}
                >
                  <Trash2 className="size-3.5" /> Eliminar cliente
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPanel({ mode: 'client-edit' })}>
                  <Pencil className="size-3.5" /> Editar cliente
                </Button>
              </div>

              {trashError && (
                <p role="alert" className="text-sm text-destructive">
                  {trashError}
                </p>
              )}

              {showConfirmTrash && (
                <ConfirmDeleteModal
                  accountName={view.clientName}
                  hasReports={false}
                  title={`¿Eliminar ${view.clientName}?`}
                  description={`El cliente y ${
                    view.accounts.length === 0
                      ? 'sus cuentas'
                      : view.accounts.length === 1
                        ? 'su cuenta publicitaria'
                        : `sus ${view.accounts.length} cuentas publicitarias`
                  } se van a mover a la papelera juntos. Vas a poder restaurarlos desde ahí, o se eliminarán definitivamente a los 45 días.`}
                  pending={trashing}
                  onConfirm={() => handleTrashClient(view.clientId, view.clientName, requestClose)}
                  onCancel={() => setShowConfirmTrash(false)}
                />
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">PM</p>
                  <p className="text-foreground">{normalizePersonName(view.pmName) ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Operador
                  </p>
                  <p className="text-foreground">{normalizePersonName(view.operatorName) ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Estado</p>
                  <p className="text-foreground">{clientStatusLabel(view.status) ?? '—'}</p>
                </div>
                {view.websiteUrl && (
                  <div className="truncate">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sitio</p>
                    {isHttpUrl(view.websiteUrl) ? (
                      <a
                        href={view.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline underline-offset-2"
                      >
                        {view.websiteUrl}
                      </a>
                    ) : (
                      <p className="truncate text-foreground">{view.websiteUrl}</p>
                    )}
                  </div>
                )}
                {view.instagramUrl && (
                  <div className="truncate">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Instagram
                    </p>
                    <p className="truncate text-foreground">{view.instagramUrl}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Presupuesto mensual total
                  </p>
                  {view.budgetByCurrency.length > 0 ? (
                    <p className="flex flex-wrap gap-x-2 tabular-nums text-foreground">
                      {view.budgetByCurrency.map(({ currency, total }) => (
                        <span key={currency}>{formatBudget(total, currency)}</span>
                      ))}
                    </p>
                  ) : (
                    <p className="text-foreground">—</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cuentas</p>
                {view.accounts.length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => setPanel({ mode: 'create' })}>
                    <Plus className="size-3.5" /> Agregar cuenta
                  </Button>
                )}
              </div>

              {view.accounts.length === 0 && (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">Este cliente todavía no tiene cuentas publicitarias.</p>
                  <Button size="sm" onClick={() => setPanel({ mode: 'create' })}>
                    <Plus className="size-3.5" /> Agregar cuenta
                  </Button>
                </div>
              )}

              {/* Toda la tarjeta edita, no solo el lápiz. El control es un
                  botón que cubre la tarjeta (`absolute inset-0`) en vez de un
                  `onClick` sobre el contenedor: así hay un único elemento
                  interactivo real —alcanzable por teclado y con nombre
                  accesible— y los enlaces de estrategia/sitio/Instagram siguen
                  funcionando por encima (`relative z-10`) sin quedar anidados
                  dentro de un botón. El lápiz queda como indicación visual, ya
                  no como el único blanco. */}
              <div className="space-y-2.5">
                {view.accounts.map((account) => (
                  <div
                    key={account.id}
                    className="group relative rounded-lg border border-border p-3.5 transition-colors focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15 hover:border-primary/40 hover:bg-secondary/40"
                  >
                    <button
                      type="button"
                      onClick={() => setPanel({ mode: 'edit', account })}
                      aria-label={`Editar ${account.name}`}
                      className="absolute inset-0 z-0 cursor-pointer rounded-lg outline-none"
                    />
                    <div className="pointer-events-none flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{account.name}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {PLATFORM_LABEL[account.platform]}
                          {statusLabel(account.management_status) ? ` · ${statusLabel(account.management_status)}` : ''}
                        </p>
                      </div>
                      <span
                        aria-hidden
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-muted/80"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <dl className="pointer-events-none relative mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px] text-muted-foreground">
                      {account.funding_method && (
                        <div>
                          <dt className="inline font-medium text-foreground">Financiamiento: </dt>
                          <dd className="inline">{fundingLabel(account.funding_method) ?? account.funding_method}</dd>
                        </div>
                      )}
                      {account.monthly_budget !== null && (
                        <div>
                          <dt className="inline font-medium text-foreground">Presupuesto: </dt>
                          <dd className="inline tabular-nums">
                            {formatBudget(account.monthly_budget, account.currency)}
                          </dd>
                        </div>
                      )}
                      {account.monthly_budget_note && (
                        <div className="col-span-2">
                          <dt className="inline font-medium text-foreground">Nota de presupuesto: </dt>
                          <dd className="inline">{account.monthly_budget_note}</dd>
                        </div>
                      )}
                      {/* Sólo cuando está fijado a mano: `null` significa que
                          lo deduce el reporte, y "Objetivo: automático" en cada
                          cuenta sería ruido en la mayoría de las filas. */}
                      {account.primary_action_type && (
                        <div className="col-span-2">
                          <dt className="inline font-medium text-foreground">Objetivo principal: </dt>
                          <dd className="inline">{objectiveLabel(account.primary_action_type)}</dd>
                        </div>
                      )}
                      {account.geo && (
                        <div>
                          <dt className="inline font-medium text-foreground">Geo: </dt>
                          <dd className="inline">{account.geo}</dd>
                        </div>
                      )}
                      {account.strategy_url && (
                        <div className="col-span-2 truncate">
                          <dt className="inline font-medium text-foreground">Estrategia: </dt>
                          <dd className="inline">
                            <a
                              href={account.strategy_url}
                              target="_blank"
                              rel="noreferrer"
                              className="pointer-events-auto relative z-10 text-primary underline underline-offset-2"
                            >
                              {account.strategy_url}
                            </a>
                          </dd>
                        </div>
                      )}
                      {account.website_url && (
                        <div className="col-span-2 truncate">
                          <dt className="inline font-medium text-foreground">Sitio: </dt>
                          <dd className="inline">
                            <a
                              href={account.website_url}
                              target="_blank"
                              rel="noreferrer"
                              className="pointer-events-auto relative z-10 text-primary underline underline-offset-2"
                            >
                              {account.website_url}
                            </a>
                          </dd>
                        </div>
                      )}
                      {account.instagram_url && (
                        <div className="col-span-2 truncate">
                          <dt className="inline font-medium text-foreground">Instagram: </dt>
                          <dd className="inline">
                            <a
                              href={account.instagram_url}
                              target="_blank"
                              rel="noreferrer"
                              className="pointer-events-auto relative z-10 text-primary underline underline-offset-2"
                            >
                              {account.instagram_url}
                            </a>
                          </dd>
                        </div>
                      )}
                      {account.notes && (
                        <div className="col-span-2">
                          <dt className="font-medium text-foreground">Notas</dt>
                          <dd className="whitespace-pre-wrap">{account.notes}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(panel.mode === 'client-create' || panel.mode === 'client-edit') && (
            <ClientForm
              mode={panel.mode === 'client-create' ? 'create' : 'edit'}
              client={panel.mode === 'client-edit' ? (view ?? undefined) : undefined}
              clientStatuses={clientStatuses}
              pmNames={pmNames}
              operators={operators}
              onSaved={handleClientSaved}
              onCancel={() => (view && panel.mode === 'client-edit' ? setPanel({ mode: 'view' }) : requestClose())}
            />
          )}

          {panel.mode === 'create' && (
            <AccountForm
              mode="create"
              statuses={statuses}
              fundingMethods={fundingMethods}
              clients={clients}
              pmNames={pmNames}
              operators={operators}
              defaultClientId={view?.clientId}
              onSaved={() => handleSaved(requestClose)}
              onCancel={() => (view ? setPanel({ mode: 'view' }) : requestClose())}
            />
          )}

          {panel.mode === 'edit' && (
            <AccountForm
              mode="edit"
              account={panel.account}
              statuses={statuses}
              fundingMethods={fundingMethods}
              clients={clients}
              pmNames={pmNames}
              operators={operators}
              accountsWithReports={accountsWithReports}
              onSaved={() => handleSaved(requestClose)}
              onCancel={() => (view ? setPanel({ mode: 'view' }) : requestClose())}
              onDeleted={() => handleSaved(requestClose)}
            />
          )}
        </>
      )}
    </SheetShell>
  )
}
