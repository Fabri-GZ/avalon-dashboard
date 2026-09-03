import { createClient } from '@/app/utils/supabase/server'
import { ClientesView } from '@/components/paid-media/ClientesView'
import { parseFilters } from '@/lib/paid-media/filters'
import { fetchAccountsWithReports } from '@/lib/paid-media/reports-presence'
import type { AdAccountRow, FundingMethodOption, ManagementStatus, Platform } from '@/lib/paid-media/types'

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

  const [statusesRes, fundingMethodsRes, peopleRes, trashCountRes, accountsWithReports] = await Promise.all([
    supabase
      .from('ad_account_management_status')
      .select('key, label, sort_order, is_active')
      .order('sort_order'),
    supabase
      .from('ad_account_funding_method')
      .select('key, label, sort_order, is_active')
      .order('sort_order'),
    // Option lists for "Operador" (filtro) y PM/Operador (formulario). Query
    // aparte y SIN filtros a propósito: derivarlas del resultado ya filtrado
    // dejaba al usuario encerrado — al filtrar por un operador, el desplegable
    // solo ofrecía ese mismo operador y no había forma de cambiar a otro sin
    // volver a "Todos" primero. Estado y plataforma no sufren esto porque
    // salen de tablas lookup.
    supabase.from('ad_accounts').select('pm_name, operator_name').is('deleted_at', null),
    // Count only, for the entry-point badge — the papelera page itself does
    // its own full query for the deleted rows.
    supabase.from('ad_accounts').select('id', { count: 'exact', head: true }).not('deleted_at', 'is', null),
    fetchAccountsWithReports(supabase),
  ])

  const statuses = (statusesRes.data ?? []) as ManagementStatus[]
  const statusKeys = new Set(statuses.map((s) => s.key))

  // Threat Matrix: untrusted URL params reaching a query builder. `.eq()`
  // values are whitelist-validated against the loaded status keys / the
  // `Platform` union before they ever reach the query — an unknown value is
  // silently ignored (todos) rather than passed through. The search term
  // never reaches an `.or()` expression (removed by D-E); it is capped and
  // normalized (`parseFilters`) before a single `.ilike('search_text', …)`.
  let query = supabase
    .from('ad_accounts')
    .select(
      'id, name, business_name, platform, client_name, management_status, funding_method, pm_name, operator_name, geo, strategy_url, notes, website_url, instagram_url, monthly_budget, monthly_budget_note, currency, primary_action_type',
    )
    .is('deleted_at', null)

  if (filters.status && statusKeys.has(filters.status)) {
    query = query.eq('management_status', filters.status)
  }
  if (filters.platform && (PLATFORM_VALUES as string[]).includes(filters.platform)) {
    query = query.eq('platform', filters.platform)
  }
  if (filters.operator) {
    query = query.eq('operator_name', filters.operator)
  }
  if (filters.q) {
    query = query.ilike('search_text', `%${filters.q}%`)
  }

  const accountsRes = await query.order('name')

  const people = (peopleRes.data ?? []) as { pm_name: string | null; operator_name: string | null }[]

  return (
    <ClientesView
      accounts={(accountsRes.data ?? []) as unknown as AdAccountRow[]}
      statuses={statuses}
      fundingMethods={(fundingMethodsRes.data ?? []) as FundingMethodOption[]}
      operators={distinctSorted(people.map((p) => p.operator_name))}
      pmNames={distinctSorted(people.map((p) => p.pm_name))}
      filters={filters}
      trashCount={trashCountRes.count ?? 0}
      accountsWithReports={accountsWithReports}
    />
  )
}
