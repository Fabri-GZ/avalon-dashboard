import { createClient } from '@/app/utils/supabase/server'
import { ReportesView } from '@/components/reportes/ReportesView'
import type { Report } from '@/lib/reportes/types'

// Server Component: el guard de ruta lo hace el middleware (ROUTE_SECTION_MAP →
// REPORTES). Acá cargamos las cuentas (picker) y el historial; RLS deja ver
// ad_accounts y reports al rol paid_media (+ admin).
export default async function ReportesPage() {
  const supabase = await createClient()

  const [accountsRes, historyRes] = await Promise.all([
    supabase.from('ad_accounts').select('id, name, business_name, platform').order('name'),
    supabase
      .from('reports')
      .select(
        'id, account_id, account_name, period_year, period_month, status, report_url, error, created_at, updated_at',
      )
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  return (
    <ReportesView
      accounts={accountsRes.data ?? []}
      initialHistory={(historyRes.data ?? []) as unknown as Report[]}
    />
  )
}
