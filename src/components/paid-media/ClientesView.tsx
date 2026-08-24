'use client'

import { useMemo, useState } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { LuUserPlus as UserPlus } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ClientesTopbar } from './ClientesTopbar'
import {
  containerVariants as _container,
  cardVariants as _card,
} from '@/app/components/Dashboard/data/dataProcessors'
import { ClientDetailSheet } from './ClientDetailSheet'
import { groupByClient } from '@/lib/paid-media/group'
import { PLATFORM_LABEL, type AdAccountRow, type ClientGroup, type ManagementStatus, type Platform } from '@/lib/paid-media/types'

const containerVariants = _container as Variants
const cardVariants = _card as Variants

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

interface Props {
  accounts: AdAccountRow[]
  statuses: ManagementStatus[]
}

/**
 * Lista de clientes (agrupados por `client_name`), con búsqueda y filtros
 * por estado/plataforma/operador. Seleccionar una fila abre el detalle en un
 * side sheet (`ClientDetailSheet`), desde donde se crean/editan cuentas.
 */
export function ClientesView({ accounts, statuses }: Props) {
  const reducedMotion = useReducedMotion()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [platformFilter, setPlatformFilter] = useState('todos')
  const [operatorFilter, setOperatorFilter] = useState('todos')
  const [detailTarget, setDetailTarget] = useState<ClientGroup | 'new' | null>(null)

  const existingClientNames = useMemo(
    () => Array.from(new Set(accounts.map((a) => a.client_name).filter((n): n is string => Boolean(n)))),
    [accounts],
  )

  const statusLabel = useMemo(() => {
    const map = new Map(statuses.map((s) => [s.key, s.label]))
    return (key: string | null) => (key ? (map.get(key) ?? key) : null)
  }, [statuses])

  const operators = useMemo(() => {
    const distinct = new Set(accounts.map((a) => a.operator_name).filter((o): o is string => Boolean(o)))
    return Array.from(distinct).sort((a, b) => a.localeCompare(b))
  }, [accounts])

  const filteredAccounts = useMemo(() => {
    const q = norm(search)
    return accounts.filter((a) => {
      if (q && !norm(a.client_name ?? '').includes(q) && !norm(a.name).includes(q)) return false
      if (statusFilter !== 'todos' && a.management_status !== statusFilter) return false
      if (platformFilter !== 'todos' && a.platform !== platformFilter) return false
      if (operatorFilter !== 'todos' && a.operator_name !== operatorFilter) return false
      return true
    })
  }, [accounts, search, statusFilter, platformFilter, operatorFilter])

  const groups = useMemo(() => groupByClient(filteredAccounts), [filteredAccounts])

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={reducedMotion ? undefined : containerVariants}
      className="flex flex-col gap-5"
    >
      <ClientesTopbar
        search={search}
        onSearchChange={setSearch}
        statuses={statuses}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        platformFilter={platformFilter}
        onPlatformChange={setPlatformFilter}
        operators={operators}
        operatorFilter={operatorFilter}
        onOperatorChange={setOperatorFilter}
        total={groups.length}
      />

      <motion.div variants={reducedMotion ? undefined : cardVariants}>
        <Card className="gap-0 overflow-hidden py-0">
          {/* Acción primaria en la cabecera de la sección, no en el topbar:
              el topbar acota lo que se mira (buscar/filtrar) y no muta nada;
              lo que modifica el conjunto vive dentro de la sección. Mismo
              patrón que `ReportHistory`. gap-y-3 porque en mobile envuelve. */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-3 border-b border-border px-5 py-4">
            <h2 className="text-[15px] font-semibold tracking-tight">Clientes</h2>
            <Button size="sm" className="ml-auto" onClick={() => setDetailTarget('new')}>
              <UserPlus className="size-3.5" /> Nuevo cliente
            </Button>
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
                              className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                            >
                              {PLATFORM_LABEL[account.platform]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{group.pmName ?? '—'}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{group.operatorName ?? '—'}</td>
                      <td className="px-5 py-3.5 text-muted-foreground tabular-nums">
                        {group.totalMonthlyBudget !== null
                          ? group.totalMonthlyBudget.toLocaleString('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      {detailTarget && (
        <ClientDetailSheet
          group={detailTarget === 'new' ? null : detailTarget}
          statuses={statuses}
          existingClientNames={existingClientNames}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </motion.div>
  )
}
