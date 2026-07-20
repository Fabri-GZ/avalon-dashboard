import type { Channel, CrmDateRange, Lead, LeadDetails, Message, Stage } from './types'
import { createClient as createServerClient } from '@/app/utils/supabase/server'

type ServerClient = Awaited<ReturnType<typeof createServerClient>>

const LEAD_FIELDS =
  'client_id, channel, session_id, nombre, contacto, stage, intencion, derivado, last_snippet, first_contact_at, last_message_at, calificado, details'

type LeadRow = {
  client_id: string
  channel: Channel
  session_id: string
  nombre: string | null
  contacto: string | null
  stage: Stage
  intencion: string | null
  derivado: boolean | null
  last_snippet: string | null
  first_contact_at: string | null
  last_message_at: string | null
  calificado: boolean | null
  details: LeadDetails
}

// TRANSITIONAL (PR3 of crm-multicliente): flattens `details` jsonb back into
// the top-level fields the current components expect. PR4 replaces this with
// a per-client registry-driven discriminated union -- see `types.ts`.
function flattenLead(row: LeadRow): Lead {
  const details = row.details ?? {}
  return {
    client_id: row.client_id,
    channel: row.channel,
    session_id: row.session_id,
    nombre: row.nombre,
    contacto: row.contacto,
    stage: row.stage,
    intencion: row.intencion,
    derivado: row.derivado,
    calificado: row.calificado,
    last_snippet: row.last_snippet,
    first_contact_at: row.first_contact_at,
    last_message_at: row.last_message_at,
    material: details.material ?? null,
    ubicacion: details.ubicacion ?? null,
    cantidad_aberturas: details.cantidad_aberturas ?? null,
    detalle_aberturas: details.detalle_aberturas ?? null,
    tipo_derivacion: details.tipo_derivacion ?? null,
    comercial_asignado: details.comercial_asignado ?? null,
  }
}

type LeadsQueryOpts = {
  channel?: Channel
  dateRange?: CrmDateRange
}

// NOTE: no cursor/pagination yet -- that lands in PR4, which extends this same
// function with a keyset cursor `(last_message_at desc, session_id desc)`.
export async function getLeadsPage(
  supabase: ServerClient,
  clientId: string,
  opts?: LeadsQueryOpts,
): Promise<Lead[]> {
  const { channel = 'whatsapp', dateRange = '30d' } = opts ?? {}

  let query = supabase
    .from('leads')
    .select(LEAD_FIELDS)
    .eq('client_id', clientId)
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
  return ((data ?? []) as unknown as LeadRow[]).map(flattenLead)
}

// NOTE: not wired into any UI yet -- PR4's kanban board reads server-side
// per-stage counts once columns are independently paginated. Added now so the
// name/shape is settled before PR4 depends on it.
export async function getStageCounts(
  supabase: ServerClient,
  clientId: string,
  channel: Channel = 'whatsapp',
): Promise<Record<Stage, number>> {
  const stages: Stage[] = ['conversando', 'derivado', 'cerrado']

  const counts = await Promise.all(
    stages.map(async (stage) => {
      const { count, error } = await supabase
        .from('leads')
        .select('session_id', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('channel', channel)
        .eq('stage', stage)

      if (error) throw new Error(error.message)
      return [stage, count ?? 0] as const
    }),
  )

  return Object.fromEntries(counts) as Record<Stage, number>
}

export async function getLeadWithMessages(
  supabase: ServerClient,
  clientId: string,
  sessionId: string,
  channel: Channel = 'whatsapp',
): Promise<{ lead: Lead; messages: Message[] } | null> {
  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select(LEAD_FIELDS)
    .eq('client_id', clientId)
    .eq('channel', channel)
    .eq('session_id', sessionId)
    .maybeSingle()

  if (leadErr) throw new Error(leadErr.message)
  if (!lead) return null

  const { data: messages, error: msgErr } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('client_id', clientId)
    .eq('channel', channel)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true })

  if (msgErr) throw new Error(msgErr.message)

  return {
    lead: flattenLead(lead as unknown as LeadRow),
    messages: (messages ?? []) as unknown as Message[],
  }
}
