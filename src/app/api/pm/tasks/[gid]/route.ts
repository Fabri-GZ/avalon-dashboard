import { updateAsanaTask } from '@/lib/asana/client'
import { supabaseAdmin } from '@/app/utils/supabase/admin'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gid: string }> }
) {
  const { gid } = await params

  const body = await request.json().catch(() => null)
  if (!body || typeof body.completed !== 'boolean') {
    return Response.json({ error: 'Invalid body' }, { status: 400 })
  }

  let asanaTask
  try {
    asanaTask = await updateAsanaTask(gid, { completed: body.completed })
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

  if (error) {
    console.error('[pm/tasks/toggle] supabase error:', error.message)
  }

  return Response.json({ data: asanaTask })
}
