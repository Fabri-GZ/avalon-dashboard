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
  | 'not_found' // zero-row write (RLS denial or stale state, no Postgres error) or P0002 from an RPC
  | 'client_trashed' // linking/restoring an account whose client is in the papelera
  | 'duplicate_client' // 23505 on create/update client (global unique name, trashed clients keep theirs)
  | 'invalid_account_id' // Meta ids must be `act_` + digits (defense in depth with the DB CHECK)
  | 'db_error'

export interface ExistingAccountInfo {
  name: string
  clientName: string | null
  deletedAt: string | null
}

// Result of the name lookup after a `duplicate_client`. `deletedAt` set means
// the colliding client is in the papelera. The lookup is RLS-scoped: a portal
// client the caller cannot see yields no info (the UI falls back to a generic
// "already exists, ask an admin").
export interface ExistingClientInfo {
  name: string
  deletedAt: string | null
}

interface ActionResult {
  success: boolean
  error?: ActionError
  existingAccount?: ExistingAccountInfo
}

interface ClientActionResult {
  success: boolean
  error?: ActionError
  clientId?: string
  existingClient?: ExistingClientInfo
}

export interface ClientInput {
  company_name: string
  website_url: string | null
  instagram_url: string | null
  pm_name: string | null
  operator_name: string | null
  status: string | null
}

export interface AccountInput {
  id: string
  name: string
  platform: Platform
  // PM, operator, web and Instagram are client-level now (ClientInput); the
  // `client_name` mirror on the row is maintained by a DB trigger from this id.
  client_id: string | null
  management_status: string | null
  // Free FK key into `ad_account_funding_method` (T1) — an open, seeded
  // lookup, not a closed union.
  funding_method: string | null
  geo: string | null
  strategy_url: string | null
  notes: string | null
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
    case '22023': // create_paid_media_client: blank name
      return 'invalid_value'
    case 'P0002':
      return 'not_found'
    default:
      return 'db_error'
  }
}

type Supabase = Awaited<ReturnType<typeof createClient>>

// Meta ids are `act_` + digits (DB CHECK `ad_accounts_meta_id_format`). The form
// already composes it, but the action re-validates so a hand-built call cannot
// reach the CHECK. Accepts a bare digit string or `act_<digits>`; anything else
// is rejected, never "fixed". Other platforms keep the trimmed text.
function normalizeAccountId(platform: Platform, raw: string): string | null {
  const id = raw.trim()
  if (platform !== 'meta') return id || null
  const match = /^(?:act_)?([0-9]+)$/i.exec(id)
  return match ? `act_${match[1]}` : null
}

async function isClientTrashed(supabase: Supabase, clientId: string): Promise<boolean> {
  const { data } = await supabase.from('client_paid_media').select('deleted_at').eq('client_id', clientId).maybeSingle()
  return Boolean(data?.deleted_at)
}

// Case-insensitive exact-name lookup, run only on the 23505 branch. The DB
// index also folds accents (`pm_unaccent`), which `ilike` cannot, so an
// accent-only collision returns nothing and the UI shows the generic message.
async function findClientByName(supabase: Supabase, name: string): Promise<ExistingClientInfo | undefined> {
  const { data } = await supabase
    .from('clients')
    .select('company_name, client_paid_media(deleted_at)')
    // Escape the LIKE wildcards so the name is matched literally.
    .ilike('company_name', name.replace(/[\\%_]/g, '\\$&'))
    .limit(1)

  const row = data?.[0]
  if (!row) return undefined
  const ext = (Array.isArray(row.client_paid_media) ? row.client_paid_media[0] : row.client_paid_media) as
    | { deleted_at: string | null }
    | undefined
  return { name: row.company_name, deletedAt: ext?.deleted_at ?? null }
}

export async function createAccountAction(input: AccountInput): Promise<ActionResult> {
  const supabase = await createClient()

  const id = normalizeAccountId(input.platform, input.id)
  if (!id) return { success: false, error: 'invalid_account_id' }
  if (input.client_id && (await isClientTrashed(supabase, input.client_id))) {
    return { success: false, error: 'client_trashed' }
  }

  const { error } = await supabase.from('ad_accounts').insert({ ...input, id })

  if (error) {
    const mappedError = mapPostgresError(error.code)

    // Duplicate act_ id (D: Duplicate act_ Disambiguation) — exactly one PK
    // lookup, only on the conflict branch, zero cost on the happy path.
    if (mappedError === 'duplicate_account') {
      const { data: existing } = await supabase
        .from('ad_accounts')
        .select('name, client_name, deleted_at')
        .eq('id', id)
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

  if (input.client_id && (await isClientTrashed(supabase, input.client_id))) {
    return { success: false, error: 'client_trashed' }
  }

  const { error } = await supabase.from('ad_accounts').update(input).eq('id', id)

  if (error) return { success: false, error: mapPostgresError(error.code) }

  revalidatePath('/dashboard/paid-media/clientes')
  return { success: true }
}

// Creates `clients` (portal_enabled=false) + `client_paid_media` in one
// transaction through the SECURITY INVOKER RPC, so RLS still decides who may.
// The RPC trims and turns blanks into null; the blank-name check here only
// saves a round trip.
export async function createClientAction(input: ClientInput): Promise<ClientActionResult> {
  const supabase = await createClient()

  const companyName = input.company_name.trim()
  if (!companyName) return { success: false, error: 'invalid_value' }

  const { data, error } = await supabase.rpc('create_paid_media_client', {
    p_company_name: companyName,
    p_website_url: input.website_url,
    p_instagram_url: input.instagram_url,
    p_pm_name: input.pm_name,
    p_operator_name: input.operator_name,
    p_status: input.status,
  })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'duplicate_client', existingClient: await findClientByName(supabase, companyName) }
    }
    return { success: false, error: mapPostgresError(error.code) }
  }

  revalidatePath('/dashboard/paid-media/clientes')
  return { success: true, clientId: data as string }
}

// Two RLS updates (clients, then the extension), each with a zero-row check:
// accepted as non-atomic (design D9) because both are idempotent on retry. A
// portal client's name is admin-only; the guard trigger raises 42501 on rename.
export async function updateClientAction(id: string, input: ClientInput): Promise<ClientActionResult> {
  const supabase = await createClient()

  const companyName = input.company_name.trim()
  if (!companyName) return { success: false, error: 'invalid_value' }

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .update({
      company_name: companyName,
      website_url: input.website_url,
      instagram_url: input.instagram_url,
    })
    .eq('id', id)
    .select('id')

  if (clientError) {
    if (clientError.code === '23505') {
      return { success: false, error: 'duplicate_client', existingClient: await findClientByName(supabase, companyName) }
    }
    return { success: false, error: mapPostgresError(clientError.code) }
  }
  if (!client || client.length === 0) return { success: false, error: 'not_found' }

  const { data: ext, error: extError } = await supabase
    .from('client_paid_media')
    .update({ pm_name: input.pm_name, operator_name: input.operator_name, status: input.status })
    .eq('client_id', id)
    .select('client_id')

  if (extError) return { success: false, error: mapPostgresError(extError.code) }
  if (!ext || ext.length === 0) return { success: false, error: 'not_found' }

  revalidatePath('/dashboard/paid-media/clientes')
  return { success: true, clientId: id }
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

// An account of a trashed client cannot be restored on its own: the client
// must come back first (restore_paid_media_client), otherwise the account would
// be active under a hidden client. App-level check (design D10), not a trigger.
// Accounts with no client (`client_id` null) skip it.
export async function restoreAccountAction(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: account } = await supabase.from('ad_accounts').select('client_id').eq('id', id).maybeSingle()

  if (account?.client_id) {
    const { data: ext } = await supabase
      .from('client_paid_media')
      .select('deleted_at')
      .eq('client_id', account.client_id)
      .maybeSingle()

    if (ext?.deleted_at) return { success: false, error: 'client_trashed' }
  }

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
