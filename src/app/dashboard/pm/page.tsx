import { createClient } from '@/app/utils/supabase/server'
import { getPmUserConfig } from '@/lib/pm/user-config'
import { PendingFeed } from '@/components/pm/feed/PendingFeed'
import { SetupEmpty } from '@/components/pm/feed/SetupEmpty'

export default async function PMPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const cfg = user ? await getPmUserConfig(user.id) : null
  const gids = cfg?.projectGids ?? []

  // Determine role to decide scoping. We rely on user_profiles for the source of truth.
  let role: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    role = profile?.role ?? null
  }

  const isAdmin = role === 'admin_global'
  const isPm = role === 'pm'

  if (isPm && gids.length === 0) {
    return (
      <div className="px-2 py-4">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
          Proyectos
        </h1>
        <SetupEmpty />
      </div>
    )
  }

  // For admin_global pass null = no scoping; for pm pass their gids.
  const scopeGids = isAdmin ? null : gids

  return (
    <div className="px-2 py-4">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
        Proyectos
      </h1>
      <PendingFeed gids={scopeGids} />
    </div>
  )
}
