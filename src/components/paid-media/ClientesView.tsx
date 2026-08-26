'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { LuTrash2 as Trash2, LuUserPlus as UserPlus } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ClientesTopbar } from './ClientesTopbar'
import {
  containerVariants as _container,
  cardVariants as _card,
} from '@/app/components/Dashboard/data/dataProcessors'
import { ClientDetailSheet } from './ClientDetailSheet'
import { groupByClient } from '@/lib/paid-media/group'
import { formatBudget } from '@/lib/paid-media/format'
import { buildHref, type ClientesFilters } from '@/lib/paid-media/filters'
import type { AccountsWithReports } from '@/lib/paid-media/reports-presence'
import {
  PLATFORM_BADGE_CLASS,
  PLATFORM_LABEL,
  type AdAccountRow,
  type ClientGroup,
  type FundingMethodOption,
  type ManagementStatus,
} from '@/lib/paid-media/types'

const containerVariants = _container as Variants
const cardVariants = _card as Variants

interface Props {
  accounts: AdAccountRow[]
  statuses: ManagementStatus[]
  fundingMethods: FundingMethodOption[]
  /**
   * Valores distintos de `operator_name` / `pm_name` sobre el dataset COMPLETO
   * (query aparte en `page.tsx`, sin filtros). No se derivan de `accounts`:
   * `accounts` ya viene filtrado, así que al filtrar por un operador el
   * desplegable solo ofrecía ese mismo operador y no había forma de cambiar a
   * otro sin volver a "Todos" primero.
   */
  operators: string[]
  pmNames: string[]
  /** The filters `page.tsx` already applied server-side. */
  filters: ClientesFilters
  /** Live count of deleted accounts, for the entry-point badge. */
  trashCount: number
  /** Optional, removable layer — see `reports-presence.ts`. */
  accountsWithReports?: AccountsWithReports
}

/**
 * Lista de clientes (agrupados por `client_name`), con búsqueda y filtros
 * por estado/plataforma/operador aplicados server-side (`page.tsx`). Los
 * filtros se aplican en diferido: `ClientesTopbar`/`ClientesFilterSheet`
 * escriben en un `draft` local y una única navegación (`router.push`) los
 * confirma. Seleccionar una fila abre el detalle en un side sheet
 * (`ClientDetailSheet`), desde donde se crean/editan cuentas.
 */
export function ClientesView({
  accounts,
  statuses,
  fundingMethods,
  operators,
  pmNames,
  filters,
  trashCount,
  accountsWithReports,
}: Props) {
  const reducedMotion = useReducedMotion()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [draft, setDraft] = useState<ClientesFilters>(filters)
  const [detailTarget, setDetailTarget] = useState<ClientGroup | 'new' | null>(null)
  const [assignTarget, setAssignTarget] = useState<AdAccountRow | null>(null)

  // Resync the draft after a real navigation lands (new `filters` prop from
  // `page.tsx`) — covers browser back/forward and direct URL edits, not
  // just the in-component apply flow.
  useEffect(() => {
    setDraft(filters)
  }, [filters])

  const existingClientNames = useMemo(
    () => Array.from(new Set(accounts.map((a) => a.client_name).filter((n): n is string => Boolean(n)))),
    [accounts],
  )

  const statusLabel = useMemo(() => {
    const map = new Map(statuses.map((s) => [s.key, s.label]))
    return (key: string | null) => (key ? (map.get(key) ?? key) : null)
  }, [statuses])

  const assignedAccounts = useMemo(() => accounts.filter((a) => a.client_name), [accounts])
  const unassignedAccounts = useMemo(() => accounts.filter((a) => !a.client_name), [accounts])

  const groups = useMemo(() => groupByClient(assignedAccounts), [assignedAccounts])

  function applyDraft(next: ClientesFilters) {
    setDraft(next)
    startTransition(() => {
      router.push(buildHref(pathname, next))
    })
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={reducedMotion ? undefined : containerVariants}
      className="flex flex-col gap-5"
    >
      <ClientesTopbar
        draft={draft}
        onApply={applyDraft}
        statuses={statuses}
        operators={operators}
        total={groups.length}
      />

      <motion.div variants={reducedMotion ? undefined : cardVariants}>
        <Card className={`gap-0 overflow-hidden py-0 transition-opacity ${isPending ? 'opacity-50' : ''}`}>
          {/* Acción primaria en la cabecera de la sección, no en el topbar:
              el topbar acota lo que se mira (buscar/filtrar) y no muta nada;
              lo que modifica el conjunto vive dentro de la sección. Mismo
              patrón que `ReportHistory`. gap-y-3 porque en mobile envuelve. */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-3 border-b border-border px-5 py-4">
            <h2 className="text-[15px] font-semibold tracking-tight">Clientes</h2>
            <div className="ml-auto flex items-center gap-2">
              <Button asChild size="sm" variant="ghost">
                <a href="/dashboard/paid-media/clientes/papelera">
                  <Trash2 className="size-3.5" /> Papelera
                  <span className="ml-1 rounded bg-secondary px-1.5 text-xs tabular-nums">{trashCount}</span>
                </a>
              </Button>
              <Button size="sm" onClick={() => setDetailTarget('new')}>
                <UserPlus className="size-3.5" /> Nuevo cliente
              </Button>
            </div>
          </div>

          {groups.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No hay clientes que coincidan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="w-[22%] px-5 py-2.5 font-semibold">Cliente</th>
                    <th className="px-5 py-2.5 font-semibold">Cuentas</th>
                    <th className="px-5 py-2.5 font-semibold">PM</th>
                    <th className="px-5 py-2.5 font-semibold">Operador</th>
                    <th className="px-5 py-2.5 font-semibold">Presupuesto mensual</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr
                      key={group.clientName}
                      onClick={() => setDetailTarget(group)}
                      className="cursor-pointer border-t border-border/60 transition-colors hover:bg-secondary/50"
                    >
                      <td className="px-5 py-3.5 font-semibold text-foreground">
                        <span className="line-clamp-2 break-words" title={group.clientName}>{group.clientName}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {group.accounts.map((account) => (
                            <span
                              key={account.id}
                              title={`${account.name}${statusLabel(account.management_status) ? ` — ${statusLabel(account.management_status)}` : ''}`}
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${PLATFORM_BADGE_CLASS[account.platform]}`}
                            >
                              {PLATFORM_LABEL[account.platform]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{group.pmName ?? '—'}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{group.operatorName ?? '—'}</td>
                      <td className="px-5 py-3.5 text-muted-foreground tabular-nums">
                        {group.budgetByCurrency.length > 0 ? (
                          <div className="flex flex-wrap gap-x-2">
                            {group.budgetByCurrency.map(({ currency, total }) => (
                              <span key={currency}>{formatBudget(total, currency)}</span>
                            ))}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="mt-5 gap-0 overflow-hidden py-0">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-[15px] font-semibold tracking-tight">Cuentas sin asignar</h2>
          </div>

          {unassignedAccounts.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Todas las cuentas activas tienen un cliente asignado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-2.5 font-semibold">Cuenta</th>
                    <th className="px-5 py-2.5 font-semibold">Plataforma</th>
                    <th className="px-5 py-2.5 font-semibold">Estado</th>
                    <th className="px-5 py-2.5 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {unassignedAccounts.map((account) => (
                    <tr key={account.id} className="border-t border-border/60">
                      <td className="px-5 py-3.5 font-medium text-foreground">{account.name}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${PLATFORM_BADGE_CLASS[account.platform]}`}
                        >
                          {PLATFORM_LABEL[account.platform]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {statusLabel(account.management_status) ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button size="sm" variant="outline" onClick={() => setAssignTarget(account)}>
                          Asignar cliente
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* `key` por destino, no decorativo: el cierre del sheet es diferido
          (animación → `onAnimationEnd` → `onClose`), así que sin key React
          reutilizaba la MISMA instancia entre destinos y arrastraba su estado
          interno. Abrir un cliente, cerrarlo y tocar "Nuevo cliente" antes de
          que termine la animación reusaba la instancia con `isClosing` todavía
          en `true` y el panel en "view": el sheet quedaba invisible (las
          animaciones son `both`, así que el fill deja el elemento fuera de
          pantalla) y su `onAnimationEnd` pendiente disparaba `onClose`, que
          ponía el destino nuevo en `null`. Resultado: el botón "Nuevo cliente"
          no hacía nada. Con key, cada destino monta una instancia limpia. */}
      {detailTarget && (
        <ClientDetailSheet
          key={detailTarget === 'new' ? 'nuevo-cliente' : `cliente:${detailTarget.clientName}`}
          group={detailTarget === 'new' ? null : detailTarget}
          statuses={statuses}
          fundingMethods={fundingMethods}
          existingClientNames={existingClientNames}
          pmNames={pmNames}
          operators={operators}
          accountsWithReports={accountsWithReports}
          onClose={() => setDetailTarget(null)}
        />
      )}

      {assignTarget && (
        <ClientDetailSheet
          key={`cuenta:${assignTarget.id}`}
          group={null}
          editAccount={assignTarget}
          statuses={statuses}
          fundingMethods={fundingMethods}
          existingClientNames={existingClientNames}
          pmNames={pmNames}
          operators={operators}
          accountsWithReports={accountsWithReports}
          onClose={() => setAssignTarget(null)}
        />
      )}
    </motion.div>
  )
}
