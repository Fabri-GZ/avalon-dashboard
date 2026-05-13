import { supabaseAdmin } from '@/app/utils/supabase/admin'

export type PmUserConfig = {
  token: string
  projectGids: string[]
}

export async function getPmUserConfig(userId: string): Promise<PmUserConfig | null> {
  const { data: cfg, error } = await supabaseAdmin
    .from('pm_user_configs')
    .select('asana_token_secret_id, asana_project_gids')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !cfg) return null

  const { data: token, error: vErr } = await supabaseAdmin
    .rpc('get_pm_user_token', { p_user_id: userId })

  if (vErr || !token) return null

  return {
    token: token as string,
    projectGids: cfg.asana_project_gids ?? [],
  }
}
