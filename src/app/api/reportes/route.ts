import { NextRequest, NextResponse } from 'next/server'
import { requireReportsAccess } from '@/lib/reportes/auth'
import { postToN8n } from '@/lib/reportes/dispatch'
import { supabaseAdmin } from '@/app/utils/supabase/admin'
import type {
  DraftsWebhookPayload,
  EnqueueErrorCode,
  GenerateReportRequest,
  GenerateReportWebhookPayload,
} from '@/lib/reportes/types'

// Typed 409 for the complete flow: `code` is what the UI switches on.
function conflict(code: EnqueueErrorCode, error: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error, code, ...extra }, { status: 409 })
}

// POSTs the job to n8n waiting only for the 2xx ack. On failure the job row is
// marked `error` and the response to return is given back; null means dispatched.
async function dispatchToN8n(jobId: string, url: string, payload: unknown) {
  const markError = (error: string) =>
    supabaseAdmin
      .from('reports')
      .update({ status: 'error', error, updated_at: new Date().toISOString() })
      .eq('id', jobId)

  const sent = await postToN8n(url, payload)
  if (sent.ok === true) return null

  await markError(sent.error)
  const isAck = sent.error.startsWith('n8n ')
  return NextResponse.json(
    { error: isAck ? `Error en n8n: ${sent.error.slice(4)}` : 'No se pudo iniciar la generación' },
    { status: 502 },
  )
}

// Encola la generación de un reporte de paid media. Espeja el patrón async de
// `agente-ia/chat`: Supabase es la fuente de verdad; n8n completa el job por
// `jobId` (insights → manifiesto → HTML → FTP) y escribe el estado final por
// service_role. El front pollea `reports` con useJobPolling<Report>.
export async function POST(req: NextRequest) {
  // Sección interna: requiere sesión Y rol (admin_global | paid_media). Va
  // primero y antes de leer el body: el insert de abajo usa service_role, que
  // ignora RLS, así que sin este chequeo cualquier usuario logueado podría
  // encolar reportes. El userId ancla `requested_by`.
  const access = await requireReportsAccess()
  if (access.ok === false) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }
  const user = { id: access.userId }

  let body: Partial<GenerateReportRequest>

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { accountId, year, month, reportType = 'summary', confirmRegenerate } = body

  if (reportType !== 'summary' && reportType !== 'complete') {
    return NextResponse.json({ error: 'reportType inválido' }, { status: 400 })
  }

  if (!accountId || typeof year !== 'number' || typeof month !== 'number') {
    return NextResponse.json(
      { error: 'accountId, year y month son requeridos' },
      { status: 400 },
    )
  }

  if (month < 1 || month > 12) {
    return NextResponse.json({ error: 'month debe estar entre 1 y 12' }, { status: 400 })
  }

  // Período futuro: bloqueado. Comparamos contra el mes actual.
  const now = new Date()
  const curY = now.getFullYear()
  const curM = now.getMonth() + 1
  if (year > curY || (year === curY && month > curM)) {
    return NextResponse.json({ error: 'No se puede generar un período futuro' }, { status: 400 })
  }

  // Snapshot del nombre de la cuenta (estable aunque luego se renombre) + valida
  // que la cuenta exista en ad_accounts.
  // Belt-and-suspenders (D7): `supabaseAdmin` is the service-role client, so
  // RLS never applies here — the `deleted_at` filter has to be explicit or a
  // soft-deleted account would still validate through this route.
  const { data: account, error: accErr } = await supabaseAdmin
    .from('ad_accounts')
    .select('id, name, currency, primary_action_type, results_config, platform, client_id')
    .eq('id', accountId)
    .is('deleted_at', null)
    .single()

  if (accErr || !account) {
    return NextResponse.json({ error: 'Cuenta inexistente' }, { status: 400 })
  }

  // Belt-and-suspenders (D7): la UI ya deshabilita "Generar" para cuentas que
  // no son de Meta, pero un botón deshabilitado es UI, no una restricción real.
  if (account.platform !== 'meta') {
    return NextResponse.json(
      { error: 'El pipeline de reportes solo soporta cuentas de Meta por ahora' },
      { status: 400 },
    )
  }

  if (reportType === 'complete') {
    return enqueueComplete({ account, year, month, userId: user.id, confirmRegenerate })
  }

  const webhookUrl = process.env.N8N_REPORTES_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json(
      { error: 'Reportes no configurado (falta N8N_REPORTES_WEBHOOK_URL)' },
      { status: 503 },
    )
  }

  // Upsert idempotente por (account_id, year, month, report_type, version): el
  // resumen es siempre `summary` v1, así que regenerar PISA el registro
  // (resetea estado a pending y limpia url/error/manifest) sin duplicar filas.
  const { data: job, error: upsertErr } = await supabaseAdmin
    .from('reports')
    .upsert(
      {
        account_id: account.id,
        account_name: account.name,
        period_year: year,
        period_month: month,
        report_type: 'summary',
        version: 1,
        status: 'pending',
        report_url: null,
        error: null,
        // Se limpia junto con `error`: si no, un reporte que falló y después se
        // regenera bien queda en `done` arrastrando el error_detail de la corrida
        // anterior, y el campo que se mira para debuggear miente.
        error_detail: null,
        manifest: null,
        requested_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'account_id,period_year,period_month,report_type,version' },
    )
    .select('id')
    .single()

  if (upsertErr || !job) {
    console.error('[api/reportes] upsert error:', upsertErr)
    return NextResponse.json({ error: 'No se pudo crear el reporte' }, { status: 500 })
  }

  // Dispara n8n esperando SOLO el ack 202 (no el HTML). n8n responde temprano y
  // sigue procesando en background.
  const webhookPayload: GenerateReportWebhookPayload = {
    jobId: job.id,
    accountId: account.id, // kept: the live n8n workflow still reads body.accountId directly
    year,
    month,
    account: {
      id: account.id,
      name: account.name,
      currency: account.currency,
      primary_action_type: account.primary_action_type,
      results_config: account.results_config,
    },
  }
  const failed = await dispatchToN8n(job.id, webhookUrl, webhookPayload)
  if (failed) return failed

  return NextResponse.json({ jobId: job.id, version: 1 })
}

interface CompleteArgs {
  account: {
    id: string
    name: string
    currency: string | null
    primary_action_type: string | null
    results_config: DraftsWebhookPayload['account']['results_config']
    client_id: string | null
  }
  year: number
  month: number
  userId: string
  confirmRegenerate?: boolean
}

// Complete report = a new `reports` row per version (report_type='complete').
// n8n's drafts workflow fills `report_texts` and moves the row to `draft_ready`.
async function enqueueComplete({ account, year, month, userId, confirmRegenerate }: CompleteArgs) {
  // The complete flow sends to the client's recipients, so an account without a
  // client cannot produce one (small reports are unaffected).
  if (!account.client_id) {
    return conflict(
      'no_client',
      'Esta cuenta no tiene un cliente asignado. Asignale un cliente en Paid Media antes de generar el reporte completo.',
    )
  }

  const webhookUrl = process.env.N8N_REPORTES_DRAFTS_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json(
      { error: 'Reportes no configurado (falta N8N_REPORTES_DRAFTS_WEBHOOK_URL)' },
      { status: 503 },
    )
  }

  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('id, company_name')
    .eq('id', account.client_id)
    .maybeSingle()
  if (!client) {
    return conflict(
      'no_client',
      'El cliente asignado a esta cuenta ya no existe. Asigná otro cliente en Paid Media.',
    )
  }

  // Versions of this period. Errored versions still occupy their number (the
  // 5-column unique key), but only `draft_ready` ones count as "already exists".
  const { data: existing, error: existingErr } = await supabaseAdmin
    .from('reports')
    .select('version, status')
    .eq('account_id', account.id)
    .eq('period_year', year)
    .eq('period_month', month)
    .eq('report_type', 'complete')
    .order('version', { ascending: false })
  if (existingErr) {
    console.error('[api/reportes] existing versions error:', existingErr)
    return NextResponse.json({ error: 'No se pudo crear el reporte' }, { status: 500 })
  }

  const versions = existing ?? []
  const inProgressMsg = 'Ya hay un reporte completo en curso para este período'
  if (versions.some((v) => v.status === 'pending' || v.status === 'running')) {
    return conflict('in_progress', inProgressMsg)
  }

  // Server-authoritative (the client's loaded history may be truncated).
  const latestDraft = versions.find((v) => v.status === 'draft_ready')
  if (latestDraft && !confirmRegenerate) {
    return conflict('complete_exists', 'Ya existe un reporte completo para este período', {
      latestVersion: latestDraft.version,
    })
  }

  const version = (versions[0]?.version ?? 0) + 1
  const { data: job, error: insertErr } = await supabaseAdmin
    .from('reports')
    .insert({
      account_id: account.id,
      account_name: account.name,
      period_year: year,
      period_month: month,
      report_type: 'complete',
      version,
      status: 'pending',
      requested_by: userId,
    })
    .select('id')
    .single()

  if (insertErr || !job) {
    // 23505: another request won the race (active-job index or same version).
    if (insertErr?.code === '23505') return conflict('in_progress', inProgressMsg)
    console.error('[api/reportes] complete insert error:', insertErr)
    return NextResponse.json({ error: 'No se pudo crear el reporte' }, { status: 500 })
  }

  const payload: DraftsWebhookPayload = {
    jobId: job.id,
    accountId: account.id,
    year,
    month,
    version,
    account: {
      id: account.id,
      name: account.name,
      currency: account.currency,
      primary_action_type: account.primary_action_type,
      results_config: account.results_config,
    },
    client: { id: client.id, name: client.company_name },
  }
  const failed = await dispatchToN8n(job.id, webhookUrl, payload)
  if (failed) return failed

  return NextResponse.json({ jobId: job.id, version })
}
