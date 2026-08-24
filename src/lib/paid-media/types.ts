// Row/option types for the paid media account registry (Clientes list).
// Hand-written: no `database.types.ts` exists in this repo (same situation
// as `src/lib/reportes/types.ts`).

export type Platform = 'meta' | 'google' | 'tiktok'

// Display labels for `Platform`. Shared: the table chips and the topbar filter
// must not drift apart.
export const PLATFORM_LABEL: Record<Platform, string> = { meta: 'Meta', google: 'Google', tiktok: 'TikTok' }
export type FundingMethod = 'linea_credito' | 'tarjeta'

// Row of `ad_account_management_status`.
export interface ManagementStatus {
  key: string
  label: string
  sort_order: number
  is_active: boolean
}

// Subset of `ad_accounts` selected by the Clientes list — active
// (`deleted_at IS NULL`) rows only. `management_status` is the FK key, not
// the label; resolve the label via the loaded `ManagementStatus[]` when
// rendering.
export interface AdAccountRow {
  id: string
  name: string
  business_name: string | null
  platform: Platform
  client_name: string | null
  management_status: string | null
  funding_method: FundingMethod | null
  pm_name: string | null
  operator_name: string | null
  geo: string | null
  strategy_url: string | null
  notes: string | null
  website_url: string | null
  instagram_url: string | null
  monthly_budget: number | null
}

// One row per distinct `client_name` in the Clientes list — accounts under
// the same client are grouped, not listed individually (see
// `src/lib/paid-media/group.ts`).
export interface ClientGroup {
  clientName: string
  accounts: AdAccountRow[] // ordered by name
  platforms: Platform[] // distinct, drives the platform chips
  pmName: string | null // first non-null; divergence is visible in the (future) detail sheet
  operatorName: string | null
  totalMonthlyBudget: number | null
}
