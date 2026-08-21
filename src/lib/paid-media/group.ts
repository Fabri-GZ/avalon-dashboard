// Pure grouping of active `ad_accounts` rows by `client_name`, into one
// `ClientGroup` per distinct name. Kept pure for readability, not
// testability — there is no test runner in this repo.

import type { AdAccountRow, ClientGroup, Platform } from './types'

// Accounts with a null/empty `client_name` are not yet mapped to a client
// (e.g. before the slice (d)/(e) initial-load migration runs). They are
// grouped under this key so they stay visible instead of silently
// disappearing from the list.
const UNASSIGNED_KEY = '__sin_cliente__'

export function groupByClient(accounts: AdAccountRow[]): ClientGroup[] {
  const groups = new Map<string, AdAccountRow[]>()

  for (const account of accounts) {
    const key = account.client_name?.trim() || UNASSIGNED_KEY
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
      const budgets = sorted
        .map((a) => a.monthly_budget)
        .filter((b): b is number => b !== null && b !== undefined)
      const totalMonthlyBudget = budgets.length > 0 ? budgets.reduce((sum, b) => sum + b, 0) : null

      return {
        clientName: clientName === UNASSIGNED_KEY ? 'Sin cliente' : clientName,
        accounts: sorted,
        platforms,
        pmName,
        operatorName,
        totalMonthlyBudget,
      }
    })
    .sort((a, b) => a.clientName.localeCompare(b.clientName))
}
