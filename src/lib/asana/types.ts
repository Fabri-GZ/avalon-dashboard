export interface AsanaSection {
  gid: string
  name: string
  created_at: string
}

export interface AsanaCustomField {
  name: string
  display_value: string | null
}

export interface AsanaTask {
  gid: string
  name: string
  completed: boolean
  completed_at: string | null
  due_on: string | null
  start_on: string | null
  assignee: { name: string } | null
  notes: string | null
  custom_fields: AsanaCustomField[]
}

export interface AsanaPaginatedResponse<T> {
  data: T[]
  next_page: { offset: string } | null
}
