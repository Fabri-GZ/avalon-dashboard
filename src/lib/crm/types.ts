export type Stage = 'nuevo' | 'conversando' | 'derivado' | 'cerrado' | 'sin_respuesta'
export type Channel = 'whatsapp'
export type Intencion = 'presupuesto' | 'postventa' | 'otro'

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
