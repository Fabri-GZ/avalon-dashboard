'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/app/utils/supabase/server'
import type { Currency, Platform } from '@/lib/paid-media/types'

// Server Actions + RLS (D3), following `crm-actions.ts` exactly. Never the
// `src/app/admin/create-client/` pattern (fetch → API route →
// `supabaseAdmin` service role) — that pattern discards the RLS guard that
// is this feature's entire authorization model.

export type ActionError =
  | 'unauthorized' // 42501
  | 'duplicate_account' // 23505
  | 'invalid_status' // 23503
  | 'invalid_value' // 23514
  | 'not_found' // zero-row write: RLS denial or stale state, no Postgres error either way
  | 'db_error'

export interface ExistingAccountInfo {
  name: string
  clientName: string | null
  deletedAt: string | null
}

interface ActionResult {
  success: boolean
  error?: ActionError
  existingAccount?: ExistingAccountInfo
}

export interface AccountInput {
  id: string
  name: string
  platform: Platform
  client_name: string | null
  management_status: string | null
  // Free FK key into `ad_account_funding_method` (T1) — an open, seeded
  // lookup, not a closed union.
  funding_method: string | null
  pm_name: string | null
  operator_name: string | null
  geo: string | null
  strategy_url: string | null
  notes: string | null
  website_url: string | null
  instagram_url: string | null
  monthly_budget: number | null
  monthly_budget_note: string | null
  currency: Currency
  // Objetivo principal elegido a mano. `null` deja que el nodo `compute` del
  // workflow lo detecte solo. Vocabulario cerrado: ver
  // `PRIMARY_OBJECTIVE_OPTIONS` en `@/lib/paid-media/types`.
  primary_action_type: string | null
}

function mapPostgresError(code: string | undefined): ActionError {
  switch (code) {
    case '42501':
      return 'unauthorized'
    case '23505':
      return 'duplicate_account'
    case '23503':
      return 'invalid_status'
    case '23514':
      return 'invalid_value'
    default:
      return 'db_error'
  }
}

export async function createAccountAction(input: AccountInput): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase.from('ad_accounts').insert(input)

  if (error) {
    const mappedError = mapPostgresError(error.code)

    // Duplicate act_ id (D: Duplicate act_ Disambiguation) — exactly one PK
    // lookup, only on the conflict branch, zero cost on the happy path.
    if (mappedError === 'duplicate_account') {
      const { data: existing } = await supabase
        .from('ad_accounts')
        .select('name, client_name, deleted_at')
        .eq('id', input.id)
        .maybeSingle()

      if (existing) {
        return {
          success: false,
          error: mappedError,
          existingAccount: {
            name: existing.name,
            clientName: existing.client_name,
            deletedAt: existing.deleted_at,
          },
        }
      }
    }

    return { success: false, error: mappedError }
  }

  revalidatePath('/dashboard/paid-media/clientes')
  return { success: true }
}

export async function updateAccountAction(
  id: string,
  input: Omit<AccountInput, 'id'>,
): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase.from('ad_accounts').update(input).eq('id', id)

  if (error) return { success: false, error: mapPostgresError(error.code) }

  revalidatePath('/dashboard/paid-media/clientes')
  return { success: true }
}

// Soft delete only — no code path ever issues DELETE FROM ad_accounts. The
// `.is('deleted_at', null)` state guard + `.select('id')` detect a zero-row
// outcome (RLS denial or stale state both return no Postgres error) and map
// it to `not_found` instead of a silent false-success.
//
// ⚠️ The read-back depends on `ad_accounts_select_paid_media` staying
// role-only. Its qual today is `(is_admin_global() OR is_paid_media())` and
// says nothing about `deleted_at`, which is why `.select('id')` can still see
// the row it just soft-deleted. Adding `deleted_at is null` to that policy
// would make every successful delete read back zero rows and report
// `not_found` — a failure message on an operation that actually worked.
// Hiding trashed rows is the app-layer filter's job, not the policy's.
//
// The timestamp comes from the Node process clock, not Postgres `now()`:
// supabase-js sends values, not SQL expressions. Irrelevant at a 45-day
// granularity, but it does mean `deleted_at` and the `now()`-defaulted
// `created_at`/`updated_at` on this table come from two different clocks.
export async function deleteAccountAction(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ad_accounts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')

  if (error) return { success: false, error: mapPostgresError(error.code) }
  if (!data || data.length === 0) return { success: false, error: 'not_found' }

  revalidatePath('/dashboard/paid-media/clientes')
  revalidatePath('/dashboard/paid-media/clientes/papelera')
  return { success: true }
}

export async function restoreAccountAction(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ad_accounts')
    .update({ deleted_at: null })
    .eq('id', id)
    .not('deleted_at', 'is', null)
    .select('id')

  if (error) return { success: false, error: mapPostgresError(error.code) }
  if (!data || data.length === 0) return { success: false, error: 'not_found' }

  revalidatePath('/dashboard/paid-media/clientes')
  revalidatePath('/dashboard/paid-media/clientes/papelera')
  return { success: true }
}
