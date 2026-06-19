import { NextRequest, NextResponse } from 'next/server'
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

  // Un único webhook genérico: n8n cambia personalidad / tools / system prompt
  // según el `department` que viaja en el payload.
  const webhookUrl = process.env.N8N_AGENT_WEBHOOK_URL

  if (!webhookUrl) {
    // Sin webhook configurado → MOCK (dev / v1 sin n8n).
    return NextResponse.json(MOCK_FIXTURE)
  }

  try {
    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000),
    })

    if (!n8nRes.ok) {
      const text = await n8nRes.text().catch(() => '')
      console.error('[agente-ia/chat] n8n error:', n8nRes.status, text)
      return NextResponse.json({ error: `Error en n8n: ${n8nRes.status}` }, { status: 502 })
    }

    const data = await n8nRes.json().catch(() => ({}))
    return NextResponse.json(data)
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError'
    console.error('[agente-ia/chat] fetch error:', err)
    return NextResponse.json(
      { error: isTimeout ? 'El agente tardó demasiado — intentá de nuevo' : 'Error de conexión con n8n' },
      { status: isTimeout ? 504 : 502 }
    )
  }
}
