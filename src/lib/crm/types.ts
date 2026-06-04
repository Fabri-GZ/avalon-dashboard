export type Stage = 'nuevo' | 'conversando' | 'derivado' | 'cerrado' | 'sin_respuesta'
export type Channel = 'whatsapp'
export type Intencion = 'presupuesto' | 'postventa' | 'otro'
export type CrmDateRange = '7d' | '30d' | '90d' | 'todo'

export interface Lead {
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

export const SELECTABLE_STAGES: Stage[] = ['nuevo', 'conversando', 'cerrado', 'sin_respuesta']

export const STAGE_UPDATE_ERROR_MESSAGES: Record<string, string> = {
  protected_stage: 'Para derivar un lead, usá el botón "Derivar Automáticamente".',
  lead_not_found: 'No encontramos este lead. Actualizá la página e intentá de nuevo.',
  unauthorized: 'No tenés permiso para cambiar el estado de este lead.',
  db_error: 'Algo salió mal al guardar el cambio. Intentá de nuevo.',
}
