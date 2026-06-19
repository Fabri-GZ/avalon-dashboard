export type Department = 'cm'

// Departamentos habilitados en v1. El route handler valida contra esta lista
// antes de proxyear a n8n. Se va ampliando cuando se prende cada departamento.
export const KNOWN_DEPARTMENTS: Department[] = ['cm']

export interface AgentChatRequest {
  department: Department
  message: string
  sessionId: string
}

export interface TrendPost {
  account: string
  url: string
  format?: string
  likes: number
  comments: number
  shares: number
  plays?: number
  postedAt: string
  ageDays: number
  score: number
}

export interface TrendResponse {
  reply: string
  results: {
    instagram: TrendPost[]
    tiktok: TrendPost[]
  }
  meta: {
    windowDays: number
    hashtags: string[]
    platforms: string[]
    requested: string
  }
}
