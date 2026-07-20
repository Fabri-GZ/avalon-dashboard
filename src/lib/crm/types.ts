export type Stage = 'conversando' | 'derivado' | 'cerrado'
export type Channel = 'whatsapp'
export type Intencion = 'presupuesto' | 'postventa' | 'otro'
export type CrmDateRange = '7d' | '30d' | '90d' | 'todo'

// TRANSITIONAL (PR3 of crm-multicliente): these keys physically live inside
// `leads.details` jsonb now (this is Grupo Norte's vocabulary specifically).
// PR4 replaces this shape with a per-client discriminated union driven by
// `src/lib/crm/registry.ts`. Until then, `queries.ts` flattens `details` back
// into these same top-level fields so existing components keep compiling
// unchanged. Do not treat this as the final design.
export interface LeadDetails {
  material?: string | null
  ubicacion?: string | null
  cantidad_aberturas?: string | null
  detalle_aberturas?: string | null
  tipo_derivacion?: string | null
  comercial_asignado?: string | null
}

export interface Lead {
  client_id: string
  channel: Channel
  session_id: string
  nombre: string | null
  contacto: string | null
  stage: Stage
  intencion: string | null
  material: string | null
  ubicacion: string | null
  cantidad_aberturas: string | null
  detalle_aberturas: string | null
  derivado: boolean | null
  tipo_derivacion: string | null
  comercial_asignado: string | null
  last_snippet: string | null
  first_contact_at: string | null
  last_message_at: string | null
  calificado: boolean | null
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
