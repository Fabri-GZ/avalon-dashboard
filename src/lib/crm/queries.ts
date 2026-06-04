import type { Channel, CrmDateRange, Lead, Message } from './types'
import { createClient as createServerClient } from '@/app/utils/supabase/server'

type ServerClient = Awaited<ReturnType<typeof createServerClient>>

const LEAD_FIELDS =
  'channel, session_id, nombre, contacto, stage, intencion, material, ubicacion, cantidad_aberturas, detalle_aberturas, derivado, tipo_derivacion, comercial_asignado, last_snippet, first_contact_at, last_message_at, calificado'

type LeadsQueryOpts = {
  channel?: Channel
  dateRange?: CrmDateRange
}

export async function getLeads(
  supabase: ServerClient,
  opts?: LeadsQueryOpts,
): Promise<Lead[]> {
  const { channel = 'whatsapp', dateRange = '30d' } = opts ?? {}

  let query = supabase
    .from('gn_leads')
    .select(LEAD_FIELDS)
    .eq('channel', channel)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (dateRange !== 'todo') {
    const DAYS: Record<Exclude<CrmDateRange, 'todo'>, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
    }
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - DAYS[dateRange])
    query = query.gte('last_message_at', threshold.toISOString())
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Lead[]
}

export async function getLeadWithMessages(
  supabase: ServerClient,
  sessionId: string,
  channel: Channel = 'whatsapp'
): Promise<{ lead: Lead; messages: Message[] } | null> {
  const { data: lead, error: leadErr } = await supabase
    .from('gn_leads')
    .select(LEAD_FIELDS)
    .eq('channel', channel)
    .eq('session_id', sessionId)
    .maybeSingle()

  if (leadErr) throw new Error(leadErr.message)
  if (!lead) return null

  const { data: messages, error: msgErr } = await supabase
    .from('gn_messages')
    .select('id, role, content, created_at')
    .eq('channel', channel)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true })

  if (msgErr) throw new Error(msgErr.message)

  return {
    lead: lead as unknown as Lead,
    messages: (messages ?? []) as unknown as Message[],
  }
}
