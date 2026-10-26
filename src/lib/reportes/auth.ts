import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/app/utils/supabase/server'

// Roles allowed to touch reports. Mirrors the DB role set
// `is_admin_global() OR is_paid_media()` used by the reports RLS policies.
const REPORTS_ROLES = ['admin_global', 'paid_media']

export type ReportsAccess =
  | { ok: true; supabase: SupabaseClient; userId: string }
  | { ok: false; status: 401 | 403; error: string }

// Server-side role gate shared by /api/reportes and the report server actions.
// Needed because those paths write with `supabaseAdmin` (service role), which
// bypasses RLS: without this check any logged-in user (e.g. client_user) could
// enqueue reports.
export async function requireReportsAccess(): Promise<ReportsAccess> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, status: 401, error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !REPORTS_ROLES.includes(profile.role)) {
    return { ok: false, status: 403, error: 'Sin permisos para generar reportes' }
  }

  return { ok: true, supabase, userId: user.id }
}
