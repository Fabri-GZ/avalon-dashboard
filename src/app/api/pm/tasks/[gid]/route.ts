import { createClient } from '@/app/utils/supabase/server'
import { getPmUserConfig } from '@/lib/pm/user-config'
import { updateAsanaTask } from '@/lib/asana/client'
import { supabaseAdmin } from '@/app/utils/supabase/admin'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gid: string }> }
) {
  const { gid } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const cfg = await getPmUserConfig(user.id)
  if (!cfg) return Response.json({ error: 'Sin configuración de Asana para este usuario' }, { status: 403 })

  // IDOR guard: verify task belongs to one of the user's projects
  const { data: task } = await supabaseAdmin
    .from('pm_tasks')
    .select('pm_clients(asana_project_id)')
    .eq('asana_task_id', gid)
    .maybeSingle()

  const projectGid = (task as any)?.pm_clients?.asana_project_id
  if (!projectGid || !cfg.projectGids.includes(projectGid)) {
    return Response.json({ error: 'Tarea no pertenece a tus proyectos' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.completed !== 'boolean') {
    return Response.json({ error: 'Invalid body' }, { status: 400 })
  }

  let asanaTask
  try {
    asanaTask = await updateAsanaTask(cfg.token, gid, { completed: body.completed })
  } catch (err) {
    console.error('[pm/tasks/toggle]', err)
    return Response.json({ error: String(err) }, { status: 502 })
  }

  const { error } = await supabaseAdmin
    .from('pm_tasks')
    .update({
      completed: body.completed,
      completed_at: body.completed ? new Date().toISOString() : null,
    })
    .eq('asana_task_id', gid)

  if (error) console.error('[pm/tasks/toggle] supabase error:', error.message)

  return Response.json({ data: asanaTask })
}
