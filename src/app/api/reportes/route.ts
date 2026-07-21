import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/utils/supabase/server'
import { supabaseAdmin } from '@/app/utils/supabase/admin'
import type { GenerateReportRequest } from '@/lib/reportes/types'
import { updatePassword } from '@/lib/auth-actions'

// Encola la generación de un reporte de paid media. Espeja el patrón async de
// `agente-ia/chat`: Supabase es la fuente de verdad; n8n completa el job por
// `jobId` (insights → manifiesto → HTML → FTP) y escribe el estado final por
// service_role. El front pollea `reports` con useJobPolling<Report>.
export async function POST(req: NextRequest) {
  let body: Partial<GenerateReportRequest>

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { accountId, year, month } = body

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

  // Sección interna: requiere sesión. El user_id ancla `requested_by`.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Snapshot del nombre de la cuenta (estable aunque luego se renombre) + valida
  // que la cuenta exista en ad_accounts.
  const { data: account, error: accErr } = await supabaseAdmin
    .from('ad_accounts')
    .select('id, name')
    .eq('id', accountId)
    .single()

  if (accErr || !account) {
    return NextResponse.json({ error: 'Cuenta inexistente' }, { status: 400 })
  }

  const webhookUrl = process.env.N8N_REPORTES_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json(
      { error: 'Reportes no configurado (falta N8N_REPORTES_WEBHOOK_URL)' },
      { status: 503 },
    )
  }

  // Upsert idempotente por (account_id, year, month): regenerar PISA el registro
  // (resetea estado a pending y limpia url/error/manifest) sin duplicar filas.
  const { data: job, error: upsertErr } = await supabaseAdmin
    .from('reports')
    .upsert(
      {
        account_id: account.id,
        account_name: account.name,
        period_year: year,
        period_month: month,
        status: 'pending',
        report_url: null,
        error: null,
        manifest: null,
        requested_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'account_id,period_year,period_month' },
    )
    .select('id')
    .single()


  if (upsertErr || !job) {
    console.error('[api/reportes] upsert error:', upsertErr)
    return NextResponse.json({ error: 'No se pudo crear el reporte' }, { status: 500 })
  }

  // Dispara n8n esperando SOLO el ack 202 (no el HTML). n8n responde temprano y
  // sigue procesando en background.
  try {
    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id, accountId: account.id, year, month }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!n8nRes.ok) {
      console.error('[api/reportes] n8n ack no-ok:', n8nRes.status)
      await supabaseAdmin
        .from('reports')
        .update({ status: 'error', error: `n8n ${n8nRes.status}`, updated_at: new Date().toISOString() })
        .eq('id', job.id)
      return NextResponse.json({ error: `Error en n8n: ${n8nRes.status}` }, { status: 502 })
    }
  } catch (err) {
    console.error('[api/reportes] n8n dispatch error:', err)
    await supabaseAdmin
      .from('reports')
      .update({ status: 'error', error: 'No se pudo despachar a n8n', updated_at: new Date().toISOString() })
      .eq('id', job.id)
    return NextResponse.json({ error: 'No se pudo iniciar la generación' }, { status: 502 })
  }

  return NextResponse.json({ jobId: job.id })
}
