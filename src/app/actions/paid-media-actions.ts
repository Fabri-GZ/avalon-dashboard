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
  | 'db_error'

interface ActionResult {
  success: boolean
  error?: ActionError
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

  if (error) return { success: false, error: mapPostgresError(error.code) }

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
