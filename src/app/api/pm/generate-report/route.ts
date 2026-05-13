import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  let body: { client_id?: string; brief_id?: string | null }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { client_id, brief_id } = body

  if (!client_id) {
    return NextResponse.json({ error: 'client_id requerido' }, { status: 400 })
  }

  const webhookUrl = process.env.N8N_REPORT_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ error: 'Webhook de reportes no configurado' }, { status: 500 })
  }

  try {
    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id, brief_id: brief_id ?? null }),
      signal: AbortSignal.timeout(90_000),
    })

    if (!n8nRes.ok) {
      const text = await n8nRes.text().catch(() => '')
      console.error('[pm/generate-report] n8n error:', n8nRes.status, text)
      return NextResponse.json(
        { error: `Error en n8n: ${n8nRes.status}` },
        { status: 502 }
      )
    }

    const data = await n8nRes.json().catch(() => ({}))
    return NextResponse.json({ report_id: data.report_id ?? null })
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError'
    console.error('[pm/generate-report] fetch error:', err)
    return NextResponse.json(
      { error: isTimeout ? 'El reporte tardó demasiado — intentá de nuevo' : 'Error de conexión con n8n' },
      { status: isTimeout ? 504 : 502 }
    )
  }
}
