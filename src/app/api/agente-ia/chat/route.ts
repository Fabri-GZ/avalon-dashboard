import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/utils/supabase/server'
import { supabaseAdmin } from '@/app/utils/supabase/admin'
import { KNOWN_DEPARTMENTS, type Department, type TrendResponse } from '@/lib/agente-ia/types'

// MOCK de v1 (departamento CM). Cuando se prendan otros departamentos, n8n
// devuelve el shape que corresponda a cada uno según el `department` del payload.
const MOCK_FIXTURE: TrendResponse = {
  reply:
    'Analizé los últimos 30 días en Instagram y TikTok. Los reels cortos con música trending están dominando el engagement. Los posts de lifestyle y detrás de cámara generan buena interacción orgánica. Te recomiendo priorizar el formato Reel 9:16 y usar los hashtags identificados.',
  results: {
    instagram: [
      { account: '@avalon.agency', url: 'https://www.instagram.com/p/mock-post-1/', format: 'Reel', likes: 1842, comments: 67, shares: 134, plays: 28400, postedAt: '2026-05-18T14:30:00Z', ageDays: 18, score: 9.2 },
      { account: '@avalon.agency', url: 'https://www.instagram.com/p/mock-post-2/', format: 'Carrusel', likes: 976, comments: 43, shares: 88, postedAt: '2026-05-22T11:00:00Z', ageDays: 14, score: 7.8 },
      { account: '@marca.cliente', url: 'https://www.instagram.com/p/mock-post-3/', format: 'Reel', likes: 3210, comments: 112, shares: 247, plays: 61000, postedAt: '2026-05-28T16:45:00Z', ageDays: 8, score: 9.7 },
    ],
    tiktok: [
      { account: '@avalonagencia', url: 'https://www.tiktok.com/@avalonagencia/video/mock-1', format: 'Video', likes: 5420, comments: 189, shares: 632, plays: 142000, postedAt: '2026-05-20T19:00:00Z', ageDays: 16, score: 9.5 },
      { account: '@avalonagencia', url: 'https://www.tiktok.com/@avalonagencia/video/mock-2', format: 'Video', likes: 2180, comments: 74, shares: 310, plays: 58000, postedAt: '2026-05-25T20:15:00Z', ageDays: 11, score: 8.1 },
    ],
  },
  meta: {
    windowDays: 30,
    hashtags: ['#marketing', '#agencia', '#socialmedia', '#contenido', '#trending'],
    platforms: ['instagram', 'tiktok'],
    requested: new Date().toISOString(),
  },
}

export async function POST(req: NextRequest) {
  let body: { message?: string; sessionId?: string; department?: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { message, sessionId, department } = body

  if (!message || !sessionId) {
    return NextResponse.json(
      { error: 'message y sessionId son requeridos' },
      { status: 400 }
    )
  }

  if (!department || !KNOWN_DEPARTMENTS.includes(department as Department)) {
    return NextResponse.json(
      { error: 'department inválido o no habilitado' },
      { status: 400 }
    )
  }

  // Sección interna: requiere sesión. El user_id ancla el RLS con el que el
  // front pollea el job (solo ve los suyos).
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const webhookUrl = process.env.N8N_AGENT_WEBHOOK_URL

  // Sin webhook configurado → MOCK (dev / v1 sin n8n). El job se crea ya
  // resuelto para que el front igual ejercite el camino de polling.
  if (!webhookUrl) {
    const { data: job, error } = await supabaseAdmin
      .from('agent_jobs')
      .insert({
        session_id: sessionId,
        department,
        user_id: user.id,
        request: { message },
        status: 'done',
        result: MOCK_FIXTURE,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !job) {
      console.error('[agente-ia/chat] mock insert error:', error)
      return NextResponse.json({ error: 'No se pudo crear el job' }, { status: 500 })
    }

    return NextResponse.json({ jobId: job.id })
  }

  // Crea el job pending: Supabase es la fuente de verdad. n8n lo completa
  // por jobId cuando termina (~100s después).
  const { data: job, error: insertErr } = await supabaseAdmin
    .from('agent_jobs')
    .insert({
      session_id: sessionId,
      department,
      user_id: user.id,
      request: { message },
    })
    .select('id')
    .single()

  if (insertErr || !job) {
    console.error('[agente-ia/chat] insert error:', insertErr)
    return NextResponse.json({ error: 'No se pudo crear el job' }, { status: 500 })
  }

  // Dispara n8n esperando SOLO el ack 202 (no el resultado). n8n responde al
  // toque vía "Respond to Webhook" temprano y sigue procesando en background.
  try {
    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, jobId: job.id }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!n8nRes.ok) {
      console.error('[agente-ia/chat] n8n ack no-ok:', n8nRes.status)
      await supabaseAdmin
        .from('agent_jobs')
        .update({ status: 'error', error: `n8n ${n8nRes.status}`, updated_at: new Date().toISOString() })
        .eq('id', job.id)
      return NextResponse.json({ error: `Error en n8n: ${n8nRes.status}` }, { status: 502 })
    }
  } catch (err) {
    // No pudimos ni despachar el job → lo marcamos error al toque (sin esperar
    // el TTL del front). El TTL cubre el caso "n8n recibió pero murió después".
    console.error('[agente-ia/chat] n8n dispatch error:', err)
    await supabaseAdmin
      .from('agent_jobs')
      .update({ status: 'error', error: 'No se pudo despachar a n8n', updated_at: new Date().toISOString() })
      .eq('id', job.id)
    return NextResponse.json({ error: 'No se pudo iniciar el agente' }, { status: 502 })
  }

  return NextResponse.json({ jobId: job.id })
}
