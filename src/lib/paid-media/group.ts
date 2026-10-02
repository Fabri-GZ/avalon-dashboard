// Pure grouping for the Clientes list: clients drive the groups, accounts are
// bucketed by `client_id`. Kept pure for readability, not testability — there
// is no test runner in this repo.
//
// A client with zero accounts still yields a group. Accounts with
// `client_id IS NULL` are NOT grouped here: they have their own "Cuentas sin
// asignar" table (`ClientesView.tsx`). Accounts pointing at a client that is
// not in `clients` (a trashed one) are ignored.

import type { AdAccountRow, ClientGroup, PaidMediaClientRow, Platform } from './types'

export function groupByClient(clients: PaidMediaClientRow[], accounts: AdAccountRow[]): ClientGroup[] {
  const byClient = new Map<string, AdAccountRow[]>()

  for (const account of accounts) {
    if (!account.client_id) continue
    const bucket = byClient.get(account.client_id)
    if (bucket) {
      bucket.push(account)
    } else {
      byClient.set(account.client_id, [account])
    }
  }

  return clients
    .map((client) => {
      const sorted = [...(byClient.get(client.id) ?? [])].sort((a, b) => a.name.localeCompare(b.name))
      const platforms = Array.from(new Set(sorted.map((a) => a.platform))) as Platform[]

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
        clientId: client.id,
        clientName: client.company_name,
        portalEnabled: client.portal_enabled,
        status: client.status,
        websiteUrl: client.website_url,
        instagramUrl: client.instagram_url,
        accounts: sorted,
        platforms,
        pmName: client.pm_name,
        operatorName: client.operator_name,
        budgetByCurrency,
      }
    })
    .sort((a, b) => a.clientName.localeCompare(b.clientName))
}
