'use server'

import { createClient } from '@/app/utils/supabase/server'

export async function deriveLeadAction(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: lead } = await supabase
    .from('gn_leads')
    .select('contacto, material, ubicacion, detalle_aberturas')
    .eq('session_id', sessionId)
    .eq('channel', 'whatsapp')
    .maybeSingle()

  if (!lead) return { success: false, error: 'lead_not_found' }

  const webhookUrl = process.env.N8N_WEBHOOK_DERIVAR_URL
  if (!webhookUrl) return { success: false, error: 'missing_webhook_url' }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        material: lead.material ?? null,
        ubicacion: lead.ubicacion ?? null,
        detalle_aberturas: lead.detalle_aberturas ?? null,
      }),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      return { success: false, error: (body as { error?: string }).error ?? 'webhook_failed' }
    }

    return { success: true }
  } catch {
    return { success: false, error: 'network_error' }
  }
}
