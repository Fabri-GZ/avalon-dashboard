import { createClient as createServerClient } from '@/app/utils/supabase/server'
import type { Role } from '@/lib/permissions'

type ServerClient = Awaited<ReturnType<typeof createServerClient>>

// Resolves the effective `client_id` for the CRM section, server-side only --
// it is never taken from the client (query params, form data, etc.).
//
// PR5 will honor `?client=<uuid>` here (CompanySwitcher sync), scoped to
// admin_global only. Until then this always resolves a single client_id, so
// the extension point is this function's signature: it will start accepting
// an optional `requestedClientId` argument and validate it against the
// resolved role before trusting it.
export async function resolveClientId(supabase: ServerClient): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, client_id')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  const role = profile.role as Role

  if (role === 'client_user') {
    return profile.client_id
  }

  // Everything else -- admin_global and pm -- falls through to the same query.
  //
  // Neither should use `profile.client_id`: internal users have their own row
  // in `clients` with no leads attached, so that would render an empty board.
  // And picking the lowest-id linked client for a pm has the same problem, just
  // less obviously: nothing says that client is one with any conversation.
  //
  // Reading the most recently active lead solves both at once, because RLS has
  // already scoped what this session can see -- admin_global sees every client,
  // a pm sees only the clients linked through pm_clients/pm_user_configs (see
  // migration 20260720_006). So the answer is "the client this user last had
  // activity on", which is both deterministic and guaranteed non-empty.
  const { data: mostRecentLead } = await supabase
    .from('leads')
    .select('client_id')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  return mostRecentLead?.client_id ?? null
}
