// The removable layer (design: "reports-presence is a removable layer, not a
// domain concept"). One module owns the whole "does this account have
// reports" signal: the type, and the single query that computes it.
//
// The prop this feeds is optional at every hop (`accountsWithReports?`), and
// each leaf applies a nullish default that IS the already-designed fallback —
// see `ConfirmDeleteModal` (`?? false`) and `DeletedCell` (`?? true`). The
// boolean selects copy only; it MUST NOT gate `deleteAccountAction`,
// `restoreAccountAction`, the confirm flow, button enablement, or any query.
//
// Removal is a clean subtraction: stop passing the prop, delete the prop
// declarations, delete this file. Nothing else changes.

import type { createClient } from '@/app/utils/supabase/server'

export type AccountsWithReports = ReadonlySet<string>

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export async function fetchAccountsWithReports(
  supabase: SupabaseServerClient,
): Promise<AccountsWithReports> {
  const { data } = await supabase.from('reports').select('account_id')
  return new Set((data ?? []).map((r) => r.account_id as string))
}
