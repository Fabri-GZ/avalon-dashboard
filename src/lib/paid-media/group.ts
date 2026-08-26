// Pure grouping of active `ad_accounts` rows by `client_name`, into one
// `ClientGroup` per distinct name. Kept pure for readability, not
// testability — there is no test runner in this repo.
//
// Unassigned rows (`client_name IS NULL`) are NOT grouped here anymore —
// they have their own "Cuentas sin asignar" table (`ClientesView.tsx`).
// Callers are expected to filter to `client_name !== null` rows before
// calling this.

import type { AdAccountRow, ClientGroup, Platform } from './types'

export function groupByClient(accounts: AdAccountRow[]): ClientGroup[] {
  const groups = new Map<string, AdAccountRow[]>()

  for (const account of accounts) {
    const key = account.client_name?.trim()
    if (!key) continue
    const bucket = groups.get(key)
    if (bucket) {
      bucket.push(account)
    } else {
      groups.set(key, [account])
    }
  }

  return Array.from(groups.entries())
    .map(([clientName, accts]) => {
      const sorted = [...accts].sort((a, b) => a.name.localeCompare(b.name))
      const platforms = Array.from(new Set(sorted.map((a) => a.platform))) as Platform[]
      const pmName = sorted.find((a) => a.pm_name)?.pm_name ?? null
      const operatorName = sorted.find((a) => a.operator_name)?.operator_name ?? null

      // Per-currency subtotals (spec: "client totals are per-currency
      // subtotals, not a single sum" — no cross-currency conversion). ARS
      // first when both are present.
      const totalsByCurrency = new Map<string, number>()
      for (const a of sorted) {
        if (a.monthly_budget === null || a.monthly_budget === undefined) continue
        totalsByCurrency.set(a.currency, (totalsByCurrency.get(a.currency) ?? 0) + a.monthly_budget)
      }
      const budgetByCurrency = Array.from(totalsByCurrency.entries())
        .map(([currency, total]) => ({ currency: currency as 'ARS' | 'USD', total }))
        .sort((a, b) => (a.currency === 'ARS' ? -1 : b.currency === 'ARS' ? 1 : 0))

      return {
        clientName,
        accounts: sorted,
        platforms,
        pmName,
        operatorName,
        budgetByCurrency,
      }
    })
    .sort((a, b) => a.clientName.localeCompare(b.clientName))
}
