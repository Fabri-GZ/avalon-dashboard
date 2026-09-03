'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LuX as X, LuPencil as Pencil, LuPlus as Plus } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { SheetShell } from '@/components/ui/sheet-shell'
import { AccountForm } from './AccountForm'
import { formatBudget } from '@/lib/paid-media/format'
import type { AccountsWithReports } from '@/lib/paid-media/reports-presence'
import { PLATFORM_LABEL, PRIMARY_OBJECTIVE_OPTIONS, type AdAccountRow, type ClientGroup, type FundingMethodOption, type ManagementStatus } from '@/lib/paid-media/types'

type Panel = { mode: 'view' } | { mode: 'create' } | { mode: 'edit'; account: AdAccountRow }

// Cae a la clave cruda si el valor guardado no está en el catálogo: es
// exactamente el caso que el nodo `compute` marca como `unknown_action_type`,
// y verlo tal cual en pantalla es la única pista de que hay que corregirlo.
function objectiveLabel(key: string): string {
  return PRIMARY_OBJECTIVE_OPTIONS.find((o) => o.key === key)?.label ?? key
}

interface Props {
  /** `null` means "create a brand-new client" — there is nothing to view yet. */
  group: ClientGroup | null
  statuses: ManagementStatus[]
  fundingMethods: FundingMethodOption[]
  existingClientNames: string[]
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
   * mode instead of view mode — jumping straight to the form that already
   * writes `client_name` via `updateAccountAction`, no new Server Action.
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
  statuses,
  fundingMethods,
  existingClientNames,
  pmNames,
  operators,
  accountsWithReports,
  onClose,
  editAccount,
}: Props) {
  const router = useRouter()
  const [panel, setPanel] = useState<Panel>(
    editAccount ? { mode: 'edit', account: editAccount } : group ? { mode: 'view' } : { mode: 'create' },
  )

  const statusLabel = useMemo(() => {
    const map = new Map(statuses.map((s) => [s.key, s.label]))
    return (key: string | null) => (key ? (map.get(key) ?? key) : null)
  }, [statuses])

  const fundingLabel = useMemo(() => {
    const map = new Map(fundingMethods.map((f) => [f.key, f.label]))
    return (key: string | null) => (key ? (map.get(key) ?? key) : null)
  }, [fundingMethods])

  const ariaLabel = editAccount ? `Asignar cliente — ${editAccount.name}` : group ? group.clientName : 'Nuevo cliente'

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
    <SheetShell ariaLabel={ariaLabel} onClose={onClose} maxWidthClassName="sm:max-w-[820px]">
      {(requestClose) => (
        <>
          <div className="sticky top-0 flex justify-center bg-card pt-3 pb-1 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-muted" />
          </div>

          <div className="flex items-start justify-between border-b border-border px-5 pt-4 pb-3">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {editAccount ? 'Asignar cliente' : group ? 'Cliente' : 'Nuevo cliente'}
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

          {panel.mode === 'view' && group && (
            <div className="space-y-4 px-5 py-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">PM</p>
                  <p className="text-foreground">{group.pmName ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Operador
                  </p>
                  <p className="text-foreground">{group.operatorName ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Presupuesto mensual total
                  </p>
                  {group.budgetByCurrency.length > 0 ? (
                    <p className="flex flex-wrap gap-x-2 tabular-nums text-foreground">
                      {group.budgetByCurrency.map(({ currency, total }) => (
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
                <Button size="sm" variant="outline" onClick={() => setPanel({ mode: 'create' })}>
                  <Plus className="size-3.5" /> Agregar cuenta
                </Button>
              </div>

              {/* Toda la tarjeta edita, no solo el lápiz. El control es un
                  botón que cubre la tarjeta (`absolute inset-0`) en vez de un
                  `onClick` sobre el contenedor: así hay un único elemento
                  interactivo real —alcanzable por teclado y con nombre
                  accesible— y los enlaces de estrategia/sitio/Instagram siguen
                  funcionando por encima (`relative z-10`) sin quedar anidados
                  dentro de un botón. El lápiz queda como indicación visual, ya
                  no como el único blanco. */}
              <div className="space-y-2.5">
                {group.accounts.map((account) => (
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

          {panel.mode === 'create' && (
            <AccountForm
              mode="create"
              statuses={statuses}
              fundingMethods={fundingMethods}
              existingClientNames={existingClientNames}
              pmNames={pmNames}
              operators={operators}
              defaultClientName={group?.clientName}
              onSaved={() => handleSaved(requestClose)}
              onCancel={() => (group ? setPanel({ mode: 'view' }) : requestClose())}
            />
          )}

          {panel.mode === 'edit' && (
            <AccountForm
              mode="edit"
              account={panel.account}
              statuses={statuses}
              fundingMethods={fundingMethods}
              existingClientNames={existingClientNames}
              pmNames={pmNames}
              operators={operators}
              accountsWithReports={accountsWithReports}
              onSaved={() => handleSaved(requestClose)}
              onCancel={() => (group ? setPanel({ mode: 'view' }) : requestClose())}
              onDeleted={() => handleSaved(requestClose)}
            />
          )}
        </>
      )}
    </SheetShell>
  )
}
