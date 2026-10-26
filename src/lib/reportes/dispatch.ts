export type N8nDispatchResult = { ok: true } | { ok: false; error: string }

// POSTs a job to an n8n webhook waiting only for the 2xx ack (10s timeout).
// Server-only: reads the shared secret. Callers own marking their job row as
// `error` on failure, since each flow writes to a different table.
export async function postToN8n(url: string, payload: unknown): Promise<N8nDispatchResult> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Shared secret (server-only): n8n rejects the call with 401 on mismatch.
        // Omitted when unset so the live workflow keeps working until n8n checks it.
        ...(process.env.N8N_REPORTES_WEBHOOK_SECRET && {
          'x-avalon-webhook-secret': process.env.N8N_REPORTES_WEBHOOK_SECRET,
        }),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      console.error('[reportes/dispatch] n8n ack no-ok:', res.status)
      return { ok: false, error: `n8n ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    console.error('[reportes/dispatch] n8n dispatch error:', err)
    return { ok: false, error: 'No se pudo despachar a n8n' }
  }
}
