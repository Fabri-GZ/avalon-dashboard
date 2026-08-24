'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LuX as X, LuPencil as Pencil, LuPlus as Plus } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { SheetShell } from '@/components/ui/sheet-shell'
import { AccountForm } from './AccountForm'
import type { AdAccountRow, ClientGroup, ManagementStatus, Platform } from '@/lib/paid-media/types'

const PLATFORM_LABEL: Record<Platform, string> = { meta: 'Meta', google: 'Google', tiktok: 'TikTok' }

type Panel = { mode: 'view' } | { mode: 'create' } | { mode: 'edit'; account: AdAccountRow }

interface Props {
  /** `null` means "create a brand-new client" — there is nothing to view yet. */
  group: ClientGroup | null
  statuses: ManagementStatus[]
  existingClientNames: string[]
  onClose: () => void
}

/**
 * Side sheet built on `SheetShell`. In "view" mode it lists the client's
 * fields plus one card per account. Selecting "Editar" (or "Agregar cuenta")
 * swaps the body for `AccountForm`, still inside the same sheet — no second
 * portal/backdrop stack.
 */
export function ClientDetailSheet({ group, statuses, existingClientNames, onClose }: Props) {
  const router = useRouter()
  const [panel, setPanel] = useState<Panel>(group ? { mode: 'view' } : { mode: 'create' })

  const statusLabel = useMemo(() => {
    const map = new Map(statuses.map((s) => [s.key, s.label]))
    return (key: string | null) => (key ? (map.get(key) ?? key) : null)
  }, [statuses])

  const ariaLabel = group ? group.clientName : 'Nuevo cliente'

  function handleSaved(requestClose: () => void) {
    router.refresh()
    // Data comes from server props; the simplest correct behavior after a
    // save is to close and let the refreshed list/detail be reopened, rather
    // than trying to reconcile a stale `group` object client-side.
    setPanel({ mode: 'view' })
    requestClose()
  }

  return (
    <SheetShell ariaLabel={ariaLabel} onClose={onClose} maxWidthClassName="sm:max-w-[560px]">
      {(requestClose) => (
        <>
          <div className="sticky top-0 flex justify-center bg-card pt-3 pb-1 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-muted" />
          </div>

          <div className="flex items-start justify-between border-b border-border px-5 pt-4 pb-3">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group ? 'Cliente' : 'Nuevo cliente'}
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
                  <p className="tabular-nums text-foreground">
                    {group.totalMonthlyBudget !== null
                      ? group.totalMonthlyBudget.toLocaleString('es-AR', {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0,
                        })
                      : '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cuentas</p>
                <Button size="sm" variant="outline" onClick={() => setPanel({ mode: 'create' })}>
                  <Plus className="size-3.5" /> Agregar cuenta
                </Button>
              </div>

              <div className="space-y-2.5">
                {group.accounts.map((account) => (
                  <div key={account.id} className="rounded-lg border border-border p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{account.name}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {PLATFORM_LABEL[account.platform]}
                          {statusLabel(account.management_status) ? ` · ${statusLabel(account.management_status)}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => setPanel({ mode: 'edit', account })}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
                        aria-label={`Editar ${account.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px] text-muted-foreground">
                      {account.funding_method && (
                        <div>
                          <dt className="inline font-medium text-foreground">Financiamiento: </dt>
                          <dd className="inline">
                            {account.funding_method === 'linea_credito' ? 'Línea de crédito' : 'Tarjeta'}
                          </dd>
                        </div>
                      )}
                      {account.monthly_budget !== null && (
                        <div>
                          <dt className="inline font-medium text-foreground">Presupuesto: </dt>
                          <dd className="inline tabular-nums">
                            {account.monthly_budget.toLocaleString('es-AR', {
                              style: 'currency',
                              currency: 'USD',
                              maximumFractionDigits: 0,
                            })}
                          </dd>
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
                              className="text-primary underline underline-offset-2"
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
                              className="text-primary underline underline-offset-2"
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
                              className="text-primary underline underline-offset-2"
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
              existingClientNames={existingClientNames}
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
              existingClientNames={existingClientNames}
              onSaved={() => handleSaved(requestClose)}
              onCancel={() => setPanel({ mode: 'view' })}
            />
          )}
        </>
      )}
    </SheetShell>
  )
}
