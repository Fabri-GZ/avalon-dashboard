import { after } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/server'
import { getPmUserConfig } from '@/lib/pm/user-config'
import { triggerSync } from '@/lib/asana/sync'
import { ClientSidebar } from '@/components/pm/sidebar/ClientSidebar'
import { PMShell } from '@/components/pm/PMShell'

export default async function PMLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cfg = await getPmUserConfig(user.id)

  if (cfg) {
    after(() => triggerSync(user.id, cfg.token, cfg.projectGids))
  }

  const gids = cfg?.projectGids ?? []

  return (
    <PMShell>
      <div
        className="-m-4 lg:-m-6 flex overflow-hidden"
        style={{ height: 'calc(100dvh - 95px)' }}
      >
        <ClientSidebar gids={gids} />
        <main className="flex-1 min-w-0 overflow-y-auto" style={{ backgroundColor: '#F4F3F8' }}>
          {children}
        </main>
      </div>
    </PMShell>
  )
}
