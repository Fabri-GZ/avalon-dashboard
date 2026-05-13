import { syncProject, syncAllProjects } from '@/lib/asana/sync'
import { ASANA_PROJECT_ALLOWLIST } from '@/lib/asana/config'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gid = searchParams.get('gid')

  try {
    if (gid) {
      const entry = Object.entries(ASANA_PROJECT_ALLOWLIST).find(([, g]) => g === gid)
      if (!entry) {
        return Response.json({ ok: false, error: 'GID no está en la allowlist' }, { status: 400 })
      }
      await syncProject(entry[0], gid)
      return Response.json({ ok: true, synced: entry[0] })
    }

    await syncAllProjects()
    return Response.json({ ok: true, synced: 'all' })
  } catch (err) {
    console.error('[pm/sync-asana]', err)
    return Response.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
