import { createClient } from '@/app/utils/supabase/server'
import { getPmUserConfig } from '@/lib/pm/user-config'
import { syncProject, syncAllProjects } from '@/lib/asana/sync'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const cfg = await getPmUserConfig(user.id)
  if (!cfg) return Response.json({ error: 'Sin configuración de Asana para este usuario' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const gid = searchParams.get('gid')

  try {
    if (gid) {
      if (!cfg.projectGids.includes(gid)) {
        return Response.json({ error: 'GID no pertenece a tu cuenta' }, { status: 403 })
      }
      await syncProject(user.id, cfg.token, gid)
      return Response.json({ ok: true, synced: gid })
    }

    await syncAllProjects(user.id, cfg.token, cfg.projectGids)
    return Response.json({ ok: true, synced: 'all' })
  } catch (err) {
    console.error('[pm/sync-asana]', err)
    return Response.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
