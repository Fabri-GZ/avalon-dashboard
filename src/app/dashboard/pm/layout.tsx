import { after } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/server'
import { getPmUserConfig } from '@/lib/pm/user-config'
import { triggerSync } from '@/lib/asana/sync'

export default async function PMLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cfg = await getPmUserConfig(user.id)

  if (cfg) {
    after(() => triggerSync(user.id, cfg.token, cfg.projectGids))
  }

  return <>{children}</>
}
