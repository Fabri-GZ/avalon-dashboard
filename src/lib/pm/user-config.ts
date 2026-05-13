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

  const { data: secret, error: vErr } = await (supabaseAdmin as any)
    .schema('vault')
    .from('decrypted_secrets')
    .select('decrypted_secret')
    .eq('id', cfg.asana_token_secret_id)
    .single()

  if (vErr || !secret?.decrypted_secret) return null

  return {
    token: secret.decrypted_secret as string,
    projectGids: cfg.asana_project_gids ?? [],
  }
}
