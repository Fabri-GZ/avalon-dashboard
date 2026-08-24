import { createClient } from '@/app/utils/supabase/server'
import { ClientesView } from '@/components/paid-media/ClientesView'
import type { AdAccountRow, ManagementStatus } from '@/lib/paid-media/types'

// Server Component: el guard de ruta lo hace el middleware (ROUTE_SECTION_MAP
// → PAID_MEDIA_CLIENTES). Mirrors `src/app/dashboard/reportes/page.tsx`.
//
// `.is('deleted_at', null)` es obligatorio desde esta slice, aunque nada
// escribe esa columna todavía (soft delete llega en la slice d) — es el seam
// que evita reescribir todas las queries de lectura más adelante.
export default async function PaidMediaClientesPage() {
  const supabase = await createClient()

  const [accountsRes, statusesRes] = await Promise.all([
    supabase
      .from('ad_accounts')
      .select(
        'id, name, business_name, platform, client_name, management_status, funding_method, pm_name, operator_name, geo, strategy_url, notes, website_url, instagram_url, monthly_budget',
      )
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('ad_account_management_status')
      .select('key, label, sort_order, is_active')
      .order('sort_order'),
  ])

  return (
    <ClientesView
      accounts={(accountsRes.data ?? []) as unknown as AdAccountRow[]}
      statuses={(statusesRes.data ?? []) as ManagementStatus[]}
    />
  )
}
