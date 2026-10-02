import { createClient } from '@/app/utils/supabase/server'
import { ClientesView } from '@/components/paid-media/ClientesView'
import { filterClientGroups, filterUnassignedAccounts, parseFilters } from '@/lib/paid-media/filters'
import { groupByClient } from '@/lib/paid-media/group'
import { fetchAccountsWithReports } from '@/lib/paid-media/reports-presence'
import type {
  AdAccountRow,
  ClientStatus,
  FundingMethodOption,
  ManagementStatus,
  PaidMediaClientRow,
  Platform,
} from '@/lib/paid-media/types'

// Server Component: el guard de ruta lo hace el middleware (ROUTE_SECTION_MAP
// → PAID_MEDIA_CLIENTES). Mirrors `src/app/dashboard/reportes/page.tsx`.
//
// `.is('deleted_at', null)` es obligatorio desde esta slice, aunque nada
// escribe esa columna todavía (soft delete llega en la slice d) — es el seam
// que evita reescribir todas las queries de lectura más adelante.

const PLATFORM_VALUES: Platform[] = ['meta', 'google', 'tiktok', 'linkedin']

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/** Distinct, non-empty, alphabetically ordered — for the option lists. */
function distinctSorted(values: (string | null)[]): string[] {
  const distinct = new Set(values.map((v) => v?.trim()).filter((v): v is string => Boolean(v)))
  return Array.from(distinct).sort((a, b) => a.localeCompare(b))
}

export default async function PaidMediaClientesPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const filters = parseFilters(await searchParams)

  const [statusesRes, clientStatusesRes, fundingMethodsRes, clientsRes, accountsRes, trashCountRes, accountsWithReports] =
    await Promise.all([
      supabase
        .from('ad_account_management_status')
        .select('key, label, sort_order, is_active')
        .order('sort_order'),
      supabase
        .from('paid_media_client_status')
        .select('key, label, sort_order, is_active')
        .order('sort_order'),
      supabase
        .from('ad_account_funding_method')
        .select('key, label, sort_order, is_active')
        .order('sort_order'),
      // Clients drive the list: active extension rows joined with their
      // `clients` row (inner join, so an extension without a visible client is
      // dropped). Unfiltered on purpose, same as the option lists used to be:
      // filtering happens in JS (`filterClientGroups`), and PM/Operador options
      // come from the full set so choosing one never locks the dropdown.
      supabase
        .from('client_paid_media')
        .select('client_id, pm_name, operator_name, status, clients!inner(company_name, website_url, instagram_url)')
        .is('deleted_at', null),
      supabase
        .from('ad_accounts')
        .select(
          'id, client_id, name, business_name, platform, client_name, management_status, funding_method, pm_name, operator_name, geo, strategy_url, notes, website_url, instagram_url, monthly_budget, monthly_budget_note, currency, primary_action_type',
        )
        .is('deleted_at', null)
        .order('name'),
      // Count only, for the entry-point badge — the papelera page itself does
      // its own full query for the deleted rows.
      supabase.from('ad_accounts').select('id', { count: 'exact', head: true }).not('deleted_at', 'is', null),
      fetchAccountsWithReports(supabase),
    ])

  const statuses = (statusesRes.data ?? []) as ManagementStatus[]
  const clientStatuses = (clientStatusesRes.data ?? []) as ClientStatus[]
  const statusKeys = new Set(clientStatuses.map((s) => s.key))

  // Threat Matrix: untrusted URL params. Nothing reaches a query builder any
  // more (filtering is pure JS), but an unknown `status`/`platform` is still
  // dropped — whitelist-validated against the loaded client status keys / the
  // `Platform` union — so a stale or hand-edited URL means "todos", not an
  // empty list.
  const safeFilters = {
    ...filters,
    status: statusKeys.has(filters.status) ? filters.status : '',
    platform: (PLATFORM_VALUES as string[]).includes(filters.platform) ? filters.platform : '',
  }

  // PostgREST returns the to-one embed as an object; the array branch only
  // guards a changed relationship shape.
  type ClientEmbed = { company_name: string; website_url: string | null; instagram_url: string | null }
  const clientRows: PaidMediaClientRow[] = (clientsRes.data ?? []).flatMap((row) => {
    const embed = (Array.isArray(row.clients) ? row.clients[0] : row.clients) as ClientEmbed | undefined
    if (!embed) return []
    return [
      {
        id: row.client_id as string,
        company_name: embed.company_name,
        website_url: embed.website_url,
        instagram_url: embed.instagram_url,
        pm_name: row.pm_name as string | null,
        operator_name: row.operator_name as string | null,
        status: row.status as string | null,
      },
    ]
  })

  const accounts = (accountsRes.data ?? []) as unknown as AdAccountRow[]
  const groups = filterClientGroups(groupByClient(clientRows, accounts), safeFilters)
  const unassignedAccounts = filterUnassignedAccounts(
    accounts.filter((a) => !a.client_id),
    safeFilters,
  )

  return (
    <ClientesView
      groups={groups}
      unassignedAccounts={unassignedAccounts}
      statuses={statuses}
      clientStatuses={clientStatuses}
      fundingMethods={(fundingMethodsRes.data ?? []) as FundingMethodOption[]}
      operators={distinctSorted(clientRows.map((c) => c.operator_name))}
      pmNames={distinctSorted(clientRows.map((c) => c.pm_name))}
      filters={safeFilters}
      trashCount={trashCountRes.count ?? 0}
      accountsWithReports={accountsWithReports}
    />
  )
}
