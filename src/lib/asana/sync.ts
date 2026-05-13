import { supabaseAdmin } from '@/app/utils/supabase/admin'
import { fetchAsana, fetchAsanaProjectName } from './client'
import type { AsanaSection, AsanaTask } from './types'

const SYNC_TTL = 15 * 60 * 1000
const lastSyncByUser = new Map<string, number>()

function customField(task: AsanaTask, name: string): string | null {
  return task.custom_fields?.find(f => f.name === name)?.display_value ?? null
}

export async function syncProject(userId: string, token: string, projectGid: string): Promise<void> {
  const projectName = await fetchAsanaProjectName(token, projectGid)
  console.log(`[asana-sync] ${userId}: sync ${projectName} (${projectGid})`)

  const { data: clientData, error: clientError } = await supabaseAdmin
    .from('pm_clients')
    .upsert({ name: projectName, asana_project_id: projectGid }, { onConflict: 'asana_project_id' })
    .select('id')
    .single()

  if (clientError || !clientData) {
    throw new Error(`Failed to upsert client ${projectName}: ${clientError?.message}`)
  }
  const clientId = clientData.id

  const sections = await fetchAsana<AsanaSection>(token, `/projects/${projectGid}/sections`, {
    opt_fields: 'gid,name,created_at',
  })

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
    const tasks = await fetchAsana<AsanaTask>(token, '/tasks', {
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

  if (taskRows.length > 0) {
    await supabaseAdmin.from('pm_tasks').upsert(taskRows, { onConflict: 'asana_task_id' })
  }

  const deleteQuery = supabaseAdmin.from('pm_tasks').delete().eq('client_id', clientId)
  if (allTaskGids.length > 0) {
    await deleteQuery.not('asana_task_id', 'in', `(${allTaskGids.join(',')})`)
  } else {
    await deleteQuery
  }

  console.log(`[asana-sync] ${userId}: ${projectName} ✓`)
}

export async function syncAllProjects(userId: string, token: string, gids: string[]): Promise<void> {
  for (const gid of gids) {
    await syncProject(userId, token, gid)
  }
}

export function triggerSync(userId: string, token: string, gids: string[]): void {
  if (!gids.length) return
  const last = lastSyncByUser.get(userId) ?? 0
  if (Date.now() - last < SYNC_TTL) return
  lastSyncByUser.set(userId, Date.now())
  syncAllProjects(userId, token, gids).catch(err =>
    console.error(`[asana-sync] ${userId}:`, err)
  )
}
