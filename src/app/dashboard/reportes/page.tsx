import { createClient } from '@/app/utils/supabase/server'
import { ReportesView } from '@/components/reportes/ReportesView'
import type { ClientRecipients, Report } from '@/lib/reportes/types'

// Server Component: el guard de ruta lo hace el middleware (ROUTE_SECTION_MAP →
// REPORTES). Acá cargamos las cuentas (picker) y el historial; RLS deja ver
// ad_accounts, reports (con sus renders/deliveries embebidos) y client_paid_media
// al rol paid_media (+ admin).
export default async function ReportesPage() {
  const supabase = await createClient()

  const [accountsRes, historyRes, recipientsRes] = await Promise.all([
    supabase
      .from('ad_accounts')
      .select('id, name, business_name, platform, client_id')
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('reports')
      .select(
        'id, account_id, account_name, period_year, period_month, report_type, version, status, report_url, error, created_at, updated_at, report_renders(id, status, report_url, pdf_url, public_id, created_at, report_deliveries(id, status))',
      )
      .order('created_at', { ascending: false })
      .limit(100),
    // Fixed send recipients (D6): one small query, joined to accounts in memory.
    supabase
      .from('client_paid_media')
      .select('client_id, report_email, report_cc_emails, clients!inner(company_name)')
      .is('deleted_at', null),
  ])

  const recipients: Record<string, ClientRecipients> = {}
  for (const row of (recipientsRes.data ?? []) as unknown as {
    client_id: string
    report_email: string | null
    report_cc_emails: string[] | null
    clients: { company_name: string }
  }[]) {
    recipients[row.client_id] = {
      name: row.clients.company_name,
      reportEmail: row.report_email,
      ccEmails: row.report_cc_emails ?? [],
    }
  }

  return (
    <ReportesView
      accounts={accountsRes.data ?? []}
      initialHistory={(historyRes.data ?? []) as unknown as Report[]}
      recipients={recipients}
    />
  )
}
