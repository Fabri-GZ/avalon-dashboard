import { supabaseAdmin } from '@/app/utils/supabase/admin'
import { fetchAsana } from './client'
import { ASANA_PROJECT_ALLOWLIST } from './config'
import type { AsanaSection, AsanaTask } from './types'

const SYNC_TTL = 15 * 60 * 1000
let lastSync = 0

function customField(task: AsanaTask, name: string): string | null {
  return task.custom_fields?.find(f => f.name === name)?.display_value ?? null
}

export async function syncProject(projectName: string, projectGid: string): Promise<void> {
  console.log(`[asana-sync] Iniciando sync: ${projectName} (${projectGid})`)

  const { data: clientData, error: clientError } = await supabaseAdmin
    .from('pm_clients')
    .upsert({ name: projectName, asana_project_id: projectGid }, { onConflict: 'asana_project_id' })
    .select('id')
    .single()

  if (clientError || !clientData) {
    throw new Error(`Failed to upsert client ${projectName}: ${clientError?.message}`)
  }
  const clientId = clientData.id

  const sections = await fetchAsana<AsanaSection>(`/projects/${projectGid}/sections`, {
    opt_fields: 'gid,name,created_at',
  })

  console.log(`[asana-sync] ${projectName}: ${sections.length} secciones encontradas`)

  if (sections.length > 0) {
    await supabaseAdmin.from('pm_sections').upsert(
      sections.map(s => ({ asana_section_id: s.gid, name: s.name, client_id: clientId })),
      { onConflict: 'asana_section_id' }
    )
  }

  const { data: dbSections } = await supabaseAdmin
    .from('pm_sections')
    .select('id, asana_section_id')
    .eq('client_id', clientId)

  const sectionIdMap = Object.fromEntries(
    (dbSections ?? []).map((s: { id: string; asana_section_id: string }) => [s.asana_section_id, s.id])
  )

  const taskRows: object[] = []
  const allTaskGids: string[] = []

  for (const section of sections) {
    const tasks = await fetchAsana<AsanaTask>('/tasks', {
      section: section.gid,
      opt_fields: 'gid,name,completed,completed_at,due_on,start_on,assignee.name,notes,custom_fields',
    })

    for (const task of tasks) {
      allTaskGids.push(task.gid)
      taskRows.push({
        asana_task_id: task.gid,
        name: task.name,
        assignee: task.assignee?.name ?? null,
        start_date: task.start_on,
        due_date: task.due_on,
        completed: task.completed,
        completed_at: task.completed_at,
        notes: task.notes,
        section_id: sectionIdMap[section.gid] ?? null,
        client_id: clientId,
        field_aprobado:   customField(task, 'Aprobado'),
        field_areas:      customField(task, 'Áreas'),
        field_proceso:    customField(task, 'Proceso'),
        field_plataforma: customField(task, 'Plataforma'),
        field_prioridad:  customField(task, 'Prioridad'),
      })
    }
  }

  console.log(`[asana-sync] ${projectName}: ${taskRows.length} tareas encontradas`)

  if (taskRows.length > 0) {
    await supabaseAdmin.from('pm_tasks').upsert(taskRows, { onConflict: 'asana_task_id' })
  }

  console.log(`[asana-sync] ${projectName}: sync completado ✓`)

  const deleteQuery = supabaseAdmin.from('pm_tasks').delete().eq('client_id', clientId)

  if (allTaskGids.length > 0) {
    await deleteQuery.not('asana_task_id', 'in', `(${allTaskGids.join(',')})`)
  } else {
    await deleteQuery
  }
}

export async function syncAllProjects(): Promise<void> {
  const entries = Object.entries(ASANA_PROJECT_ALLOWLIST)
  for (const [name, gid] of entries) {
    await syncProject(name, gid)
  }
}

export function triggerSync(): void {
  if (Date.now() - lastSync < SYNC_TTL) return
  lastSync = Date.now()
  syncAllProjects().catch(err => console.error('[asana-sync]', err))
}
