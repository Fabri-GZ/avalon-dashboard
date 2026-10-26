import { notFound } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/server'
import { ReportEditorView } from '@/components/reportes/ReportEditorView'
import type { Report, ReportText } from '@/lib/reportes/types'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type EditorReport = Pick<
  Report,
  'id' | 'account_id' | 'account_name' | 'period_year' | 'period_month' | 'report_type' | 'version' | 'status'
>

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

  const { data: report } = await supabase
    .from('reports')
    .select('id, account_id, account_name, period_year, period_month, report_type, version, status')
    .eq('id', reportId)
    .maybeSingle<EditorReport>()

  if (!report || report.report_type !== 'complete') notFound()

  const [textsRes, versionsRes] = await Promise.all([
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
  ])

  return (
    <ReportEditorView
      report={report}
      initialTexts={(textsRes.data ?? []) as unknown as ReportText[]}
      versions={versionsRes.data ?? []}
    />
  )
}
