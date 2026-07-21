import { notFound } from 'next/navigation'
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
// `client_id` that doesn't exist, calls `notFound()`.
//
// Why 404 and not 403 or a redirect: a 404 does not distinguish "this client
// does not exist" from "it exists but is not yours" -- a `client_user` who
// tries `?client=<someone-else's-uuid>` gets the exact same response as one
// who tries a random uuid, which is what stops them from probing which ids
// are valid. A 403 (or a redirect that lands somewhere different for "exists"
// vs "doesn't exist") would leak that distinction.
//
// Why not `redirect()`: on Next 16.1.4 deployed to Vercel, calling
// `redirect()` from inside a Server Component's render -- including from a
// nested async helper like this one, not just the top level -- produces a
// broken RSC payload when the target is the *same* pathname the request came
// from (this route is the textbook case, since it always redirects back to
// itself). The board renders empty and React throws error #310 on hydration.
// `notFound()` does not share this failure mode: it renders the nearest
// `not-found` boundary within the same request, no navigation involved. Do
// not reintroduce `redirect()` here for this reason alone -- see
// `next.config.mjs:8` for the same hazard documented against
// `reactCompiler: true`.
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

  // Ordered above the client_user return on purpose. Falling through would
  // resolve their own client and render a board while the URL still named a
  // different one -- a page that quietly contradicts its own address. A param
  // this role can never legitimately produce (the switcher only renders for
  // admin_global) is treated as a bad request instead.
  if (requestedClientId && role !== 'admin_global') {
    notFound()
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
      notFound()
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
