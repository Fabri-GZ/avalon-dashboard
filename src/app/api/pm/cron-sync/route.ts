import { supabaseAdmin } from '@/app/utils/supabase/admin'
import { getPmUserConfig } from '@/lib/pm/user-config'
import { syncAllProjects } from '@/lib/asana/sync'

export const maxDuration = 300

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: pmUsers, error } = await supabaseAdmin
    .from('pm_user_configs')
    .select('user_id')

  if (error || !pmUsers?.length) {
    return Response.json({ ok: true, synced: 0 })
  }

  const results = await Promise.allSettled(
    pmUsers.map(async ({ user_id }) => {
      const cfg = await getPmUserConfig(user_id)
      if (!cfg) return { user_id, status: 'no_config' }
      await syncAllProjects(user_id, cfg.token, cfg.projectGids)
      return { user_id, status: 'ok', projects: cfg.projectGids.length }
    })
  )

  const summary = results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { user_id: pmUsers[i].user_id, status: 'error', error: String((r as PromiseRejectedResult).reason) }
  )

  console.log('[pm/cron-sync]', JSON.stringify(summary))
  return Response.json({ ok: true, summary })
}
