import { createClient } from '@/app/utils/supabase/server'
import { getPmUserConfig } from '@/lib/pm/user-config'
import { syncProject } from '@/lib/asana/sync'
import { supabaseAdmin } from '@/app/utils/supabase/admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  // 1. Authn
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  // 2. Role check (pm only)
  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'pm') {
    return Response.json({ error: 'Solo PMs' }, { status: 403 })
  }

  // 3. Parse body
  let body: { projectGid?: unknown; clientId?: unknown }
  try { body = await request.json() } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const { projectGid, clientId } = body
  if (typeof projectGid !== 'string' || !projectGid) {
    return Response.json({ error: 'projectGid requerido' }, { status: 400 })
  }
  if (typeof clientId !== 'string' || !UUID_RE.test(clientId)) {
    return Response.json({ error: 'clientId inválido' }, { status: 400 })
  }

  // 4. Ownership — projectGid must be in caller's asana_project_gids
  const cfg = await getPmUserConfig(user.id)
  if (!cfg) return Response.json({ error: 'Sin configuración' }, { status: 403 })
  if (!cfg.projectGids.includes(projectGid)) {
    return Response.json({ error: 'GID no pertenece a tu cuenta' }, { status: 403 })
  }

  // 5. Verify client exists (avoid masking FK error as 500)
  const { data: clientExists } = await supabaseAdmin
    .from('clients').select('id').eq('id', clientId).maybeSingle()
  if (!clientExists) {
    return Response.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  // 6. Delegate to syncProject with clientId
  try {
    await syncProject(user.id, cfg.token, projectGid, clientId)
  } catch (err) {
    console.error('[pm/link-client]', err)
    return Response.json({ ok: false, error: String(err) }, { status: 500 })
  }

  // 7. Return linked row
  const { data: pmClient } = await supabaseAdmin
    .from('pm_clients')
    .select('id, name, asana_project_id, client_id, status')
    .eq('asana_project_id', projectGid)
    .single()

  return Response.json({ ok: true, pmClient })
}
