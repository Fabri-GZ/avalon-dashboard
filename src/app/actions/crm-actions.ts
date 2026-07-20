'use server'

import { createClient } from '@/app/utils/supabase/server'
import { resolveClientId } from '@/lib/crm/resolveClientId'
import type { LeadDetails, Stage } from '@/lib/crm/types'

type UpdateStageError = 'protected_stage' | 'lead_not_found' | 'unauthorized' | 'db_error'

export async function updateStageAction(
  sessionId: string,
  newStage: Stage,
): Promise<{ success: boolean; error?: UpdateStageError }> {
  if (newStage === 'derivado') return { success: false, error: 'protected_stage' }

  const supabase = await createClient()
  const clientId = await resolveClientId(supabase)
  if (!clientId) return { success: false, error: 'unauthorized' }

  const { data, error } = await supabase
    .from('leads')
    .update({ stage: newStage })
    .eq('client_id', clientId)
    .eq('session_id', sessionId)
    .eq('channel', 'whatsapp')
    .select('session_id')
    .maybeSingle()

  if (error) {
    if (error.code === '42501') return { success: false, error: 'unauthorized' }
    return { success: false, error: 'db_error' }
  }
  if (!data) return { success: false, error: 'lead_not_found' }
  return { success: true }
}

export async function deriveLeadAction(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const clientId = await resolveClientId(supabase)
  if (!clientId) return { success: false, error: 'unauthorized' }

  const { data: lead } = await supabase
    .from('leads')
    .select('contacto, details')
    .eq('client_id', clientId)
    .eq('session_id', sessionId)
    .eq('channel', 'whatsapp')
    .maybeSingle()

  if (!lead) return { success: false, error: 'lead_not_found' }

  // TRANSITIONAL (PR3): payload keys are still GN-only, read out of `details`.
  // Per-client webhook resolution + a generic `{ client_key, session_id,
  // details }` payload is PR6 scope.
  const details = (lead.details ?? {}) as LeadDetails

  const webhookUrl = process.env.N8N_WEBHOOK_DERIVAR_URL
  if (!webhookUrl) return { success: false, error: 'missing_webhook_url' }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        material: details.material ?? null,
        ubicacion: details.ubicacion ?? null,
        detalle_aberturas: details.detalle_aberturas ?? null,
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
