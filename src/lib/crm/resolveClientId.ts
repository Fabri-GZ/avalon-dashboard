import { redirect } from 'next/navigation'
import { createClient as createServerClient } from '@/app/utils/supabase/server'
import type { Role } from '@/lib/permissions'

type ServerClient = Awaited<ReturnType<typeof createServerClient>>

// Resolves the effective `client_id` for the CRM section, server-side only --
// it is never taken from the client (query params, form data, etc.) without
// being validated against the resolved role first.
//
// `requestedClientId` is `?client=<uuid>` from the CompanySwitcher sync
// (`CrmClientSync.tsx` mirrors the *result* of this function back into the
// dashboard context -- it never trusts the param itself). It is honored ONLY
// for `admin_global`: any other role passing it, or an admin_global passing a
// `client_id` that doesn't exist, gets redirected back to the bare CRM route
// so the URL stops lying about which client is actually being shown, and the
// normal fallback resolution below picks a client they're allowed to see.
//
// Known tradeoff: the redirect drops any other search params (`q`,
// `pages_*`) present on an invalid/unauthorized request. Acceptable because
// this only fires on a malformed or unauthorized `?client=`, not on normal
// navigation.
export async function resolveClientId(
  supabase: ServerClient,
  requestedClientId?: string | null,
): Promise<string | null> {
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

  // The param check comes before the client_user return on purpose: a
  // client_user resolves to their own client either way, but leaving `?client=`
  // in the URL would keep it claiming a client that isn't the one on screen.
  if (requestedClientId && role !== 'admin_global') {
    redirect('/dashboard/chatbot/crm')
  }

  if (role === 'client_user') {
    return profile.client_id
  }

  if (requestedClientId) {
    const { data: requested } = await supabase
      .from('clients')
      .select('id')
      .eq('id', requestedClientId)
      .maybeSingle()

    if (!requested) {
      redirect('/dashboard/chatbot/crm')
    }

    return requestedClientId
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
