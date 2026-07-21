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
    .select('details, clients(client_key, webhook_derivar_url)')
    .eq('client_id', clientId)
    .eq('session_id', sessionId)
    .eq('channel', 'whatsapp')
    .maybeSingle()

  if (!lead) return { success: false, error: 'lead_not_found' }

  type LeadForDerive = {
    details: LeadDetails | null
    clients: { client_key: string | null; webhook_derivar_url: string | null } | null
  }

  const client = (lead as unknown as LeadForDerive).clients
  const webhookUrl = client?.webhook_derivar_url
  if (!webhookUrl) return { success: false, error: 'missing_webhook_url' }

  const clientKey = client?.client_key ?? ''
  const details = (lead as unknown as LeadForDerive).details ?? {}

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_key: clientKey, session_id: sessionId, details }),
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
