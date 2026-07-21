export type Stage = 'conversando' | 'derivado' | 'cerrado'
export type Channel = 'whatsapp'
export type Intencion = 'presupuesto' | 'postventa' | 'otro'
export type CrmDateRange = '7d' | '30d' | '90d' | 'todo'

// The known `clients.client_key` vocabularies as of this batch -- documented
// for readability only, NOT an exhaustive runtime constraint. `Lead.client_key`
// stays `string`: a client can exist without a registry entry (see design D2),
// and the UI must degrade gracefully instead of narrowing types against it.
export type ClientKey = 'grupo-norte' | 'fz-motos' | 'viviera'

// `details` is untyped jsonb (design D2): its shape is entirely driven by
// whichever client's chatbot prompt in n8n wrote it, and those prompts change
// without a deploy. `src/lib/crm/registry.ts` is the single place that
// interprets these keys per `client_key` -- nothing else should assume a
// specific field exists on it.
export type LeadDetails = Record<string, unknown>

export interface Lead {
  client_id: string
  client_key: string
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

export interface Message {
  id: number
  role: 'user' | 'bot'
  content: string
  created_at: string | null
}

export const SELECTABLE_STAGES: Stage[] = ['conversando', 'cerrado']

export const STAGE_UPDATE_ERROR_MESSAGES: Record<string, string> = {
  protected_stage: 'Para derivar un lead, usá el botón "Derivar Automáticamente".',
  lead_not_found: 'No encontramos este lead. Actualizá la página e intentá de nuevo.',
  unauthorized: 'No tenés permiso para cambiar el estado de este lead.',
  db_error: 'Algo salió mal al guardar el cambio. Intentá de nuevo.',
}
