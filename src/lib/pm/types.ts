export type ReportStatus = 'green' | 'yellow' | 'red'

export interface Client {
  id: string
  name: string
  asana_project_id: string
  status: ReportStatus | null
  created_at: string
}

export interface Brief {
  id: string
  client_id: string
  content: string
  source: string
  created_at: string
}

export interface Section {
  id: string
  client_id: string
  name: string
  asana_section_id: string
  order: number | null
}

export interface Task {
  id: string
  section_id: string | null
  client_id: string
  asana_task_id: string
  name: string
  assignee: string | null
  start_date: string | null
  due_date: string | null
  completed: boolean
  completed_at: string | null
  field_aprobado: string | null
  field_areas: string | null
  field_proceso: string | null
  field_plataforma: string | null
  field_prioridad: string | null
  notes: string | null
}

export interface SectionWithTasks extends Section {
  tasks: Task[]
}

export interface Report {
  id: string
  client_id: string
  brief_id: string | null
  status: ReportStatus
  summary: string | null
  deviations: string[]
  risks: string[]
  recommendations: string[]
  raw_response: unknown
  generated_at: string
}

export type FeedBadge = 'overdue' | 'due' | 'brief' | 'report'

export interface FeedItem {
  id: string
  clientId: string
  clientName: string
  title: string
  badge: FeedBadge
  sectionName?: string
  dueDate?: string | null
  daysOverdue?: number
  daysUntilDue?: number
  priority?: string | null
}

export interface FeedStats {
  overdue: number
  thisWeek: number
  withoutBrief: number
  activeClients: number
}

export interface FeedData {
  stats: FeedStats
  groups: {
    immediate: FeedItem[]
    thisWeek: FeedItem[]
    setup: FeedItem[]
  }
}
