import { notFound } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/server'
import { ReportEditorView } from '@/components/reportes/ReportEditorView'
import type { RenderHistoryItem } from '@/components/reportes/ReportRenderHistory'
import type { ClientRecipients, Report, ReportText } from '@/lib/reportes/types'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type EditorReport = Pick<
  Report,
  'id' | 'account_id' | 'account_name' | 'period_year' | 'period_month' | 'report_type' | 'version' | 'status'
> & { report_data: unknown }

// Server Component: the prefix guard is the middleware (ROUTE_SECTION_MAP →
// REPORTES) and RLS only lets admin_global/paid_media read reports, so any other
// role gets an empty result and lands on 404.
export default async function ReportEditorPage({
  params,
}: {
  params: Promise<{ reportId: string }>
}) {
  const { reportId } = await params
  if (!UUID_RE.test(reportId)) notFound()

  const supabase = await createClient()

  const { data: report, error: reportErr } = await supabase
    .from('reports')
    .select('id, account_id, account_name, period_year, period_month, report_type, version, status, report_data')
    .eq('id', reportId)
    .maybeSingle<EditorReport>()

  // A query failure is not "not found": throw so the error boundary shows it.
  if (reportErr) throw new Error(`No se pudo cargar el reporte: ${reportErr.message}`)
  if (!report || report.report_type !== 'complete') notFound()

  const [textsRes, versionsRes, rendersRes, periodRes, accountRes] = await Promise.all([
    supabase
      .from('report_texts')
      .select('id, section_key, section_label, sort_order, ai_text, ai_rationale, edited_text')
      .eq('report_id', report.id)
      .order('sort_order'),
    // Other versions of the same account + period that actually have a draft.
    supabase
      .from('reports')
      .select('id, version')
      .eq('account_id', report.account_id)
      .eq('period_year', report.period_year)
      .eq('period_month', report.period_month)
      .eq('report_type', 'complete')
      .eq('status', 'draft_ready')
      .order('version', { ascending: false }),
    supabase
      .from('report_renders')
      .select('id, public_id, status, report_url, pdf_url, error, created_at')
      .eq('report_id', report.id)
      .order('created_at', { ascending: false }),
    // Every complete version of the period with its renders and deliveries: the
    // send dialog needs how many times the period was already sent.
    supabase
      .from('reports')
      .select(
        'id, account_id, account_name, period_year, period_month, report_type, version, status, report_url, error, created_at, updated_at, report_renders(id, status, report_url, pdf_url, public_id, created_at, report_deliveries(id, status))',
      )
      .eq('account_id', report.account_id)
      .eq('period_year', report.period_year)
      .eq('period_month', report.period_month)
      .eq('report_type', 'complete'),
    supabase.from('ad_accounts').select('client_id').eq('id', report.account_id).maybeSingle(),
  ])
  const childErr =
    textsRes.error ?? versionsRes.error ?? rendersRes.error ?? periodRes.error ?? accountRes.error
  if (childErr) throw new Error(`No se pudo cargar el reporte: ${childErr.message}`)

  // Fixed send recipients (D6), same source as the reports list. A failed query
  // blocks the send instead of showing "sin mail".
  let recipients: ClientRecipients | null = null
  let recipientsError = false
  const clientId = accountRes.data?.client_id as string | null | undefined
  if (clientId) {
    const { data, error } = await supabase
      .from('client_paid_media')
      .select('report_email, report_cc_emails, clients!inner(company_name)')
      .eq('client_id', clientId)
      .is('deleted_at', null)
      .maybeSingle()
    if (error) {
      console.error('[reportes] recipients query error:', error)
      recipientsError = true
    } else if (data) {
      const row = data as unknown as {
        report_email: string | null
        report_cc_emails: string[] | null
        clients: { company_name: string }
      }
      recipients = {
        name: row.clients.company_name,
        reportEmail: row.report_email,
        ccEmails: row.report_cc_emails ?? [],
      }
    }
  }

  return (
    <ReportEditorView
      report={report}
      initialTexts={(textsRes.data ?? []) as unknown as ReportText[]}
      versions={versionsRes.data ?? []}
      initialRenders={(rendersRes.data ?? []) as RenderHistoryItem[]}
      reportData={report.report_data}
      periodReports={(periodRes.data ?? []) as unknown as Report[]}
      recipients={recipients}
      recipientsError={recipientsError}
    />
  )
}
