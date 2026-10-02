// Row/option types for the paid media account registry (Clientes list).
// Hand-written: no `database.types.ts` exists in this repo (same situation
// as `src/lib/reportes/types.ts`).

export type Platform = 'meta' | 'google' | 'tiktok' | 'linkedin'

// Display labels for `Platform`. Shared: the table chips and the topbar
// filter must not drift apart.
export const PLATFORM_LABEL: Record<Platform, string> = {
  meta: 'Meta',
  google: 'Google',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
}

// Per-platform badge background/text, distinct enough to tell four badges
// apart at a glance (spec: "no two platform badges share the same
// background color"). Applied on top of the existing badge shape.
export const PLATFORM_BADGE_CLASS: Record<Platform, string> = {
  meta: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  google: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  tiktok: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300',
  linkedin: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
}

export type Currency = 'ARS' | 'USD'

// Row of `ad_account_management_status`.
export interface ManagementStatus {
  key: string
  label: string
  sort_order: number
  is_active: boolean
}

// Row of `paid_media_client_status`: the client-level status (nuevo_cliente,
// activo, ...). Same shape as `ManagementStatus` but a separate lookup — the
// account-level keys (saldo_agregado, ...) no longer share a table with it.
export interface ClientStatus {
  key: string
  label: string
  sort_order: number
  is_active: boolean
}

// Row of `ad_account_funding_method` (T1) — replaces the closed
// `FundingMethod` union: funding method is now an open, seeded lookup, so a
// new value needs no code change (design D-A).
export interface FundingMethodOption {
  key: string
  label: string
  sort_order: number
  is_active: boolean
}

// Objetivo principal de la cuenta, elegido a mano por el equipo.
//
// A DIFERENCIA de `management_status` y `funding_method`, esto NO es una tabla
// de lookup en la base, y la diferencia es deliberada: aquellos dos son datos
// de display y nadie más los consume, mientras que este valor viaja en el
// payload del webhook y lo lee el nodo `compute` del workflow
// REPORTES-PAID-MEDIA, que sólo conoce las claves de su `ACTION_TYPE_META`.
// Un valor fuera de ese catálogo no rompe fuerte: compute lo marca como
// `configError: unknown_action_type` y vuelve a la detección automática, o
// sea, el reporte sale mal en silencio. Una tabla abierta donde cualquiera
// puede insertar una opción nueva es exactamente la forma de provocar eso.
//
// ⚠️ FUENTE DE VERDAD: `ACTION_TYPE_META` en el nodo `compute`. Si agregás una
// opción acá, tiene que existir allá primero.
//
// El catálogo de compute tiene claves duplicadas por significado (WhatsApp 7d
// y 1d, cuatro variantes de compra); acá se expone una sola por objetivo real
// de negocio, la más abarcativa.
export const PRIMARY_OBJECTIVE_OPTIONS: { key: string; label: string }[] = [
  // Centinela, NO un action_type de Meta: `reach` es un campo escalar de la
  // fila de insights, no una entrada del array `actions[]`, así que alcance no
  // se puede expresar como conversión. `compute` lo reconoce por esta clave
  // exacta y arma un reporte con hero [Inversión, Alcance, Impresiones,
  // Frecuencia, CPM] en vez de [.., conversiones, CPA]. Ver
  // Testeo/n8n/avalon/reportes-paid-media/fixes/2026-09-03/modo-awareness/.
  { key: '__awareness__', label: 'Alcance / Awareness' },
  { key: 'onsite_conversion.messaging_conversation_started_7d', label: 'Conversaciones de WhatsApp' },
  { key: 'lead', label: 'Leads' },
  { key: 'onsite_conversion.lead', label: 'Leads (formulario de Meta)' },
  { key: 'omni_purchase', label: 'Compras' },
  { key: 'link_click', label: 'Clics al sitio web' },
  { key: 'landing_page_view', label: 'Visitas a la página' },
  { key: 'mobile_app_install', label: 'Instalaciones de la app' },
]

// Subset of `ad_accounts` selected by the Clientes list — active
// (`deleted_at IS NULL`) rows only. `management_status` and `funding_method`
// are FK keys, not labels; resolve the label via the loaded
// `ManagementStatus[]` / `FundingMethodOption[]` when rendering.
//
// `search_text` is a filter target only (used server-side via `.ilike`) —
// it is never selected by the app, so it is intentionally absent here.
export interface AdAccountRow {
  id: string
  // Link to `clients.id`; `null` = unassigned ("Cuentas sin asignar").
  client_id: string | null
  name: string
  business_name: string | null
  platform: Platform
  client_name: string | null
  management_status: string | null
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
  // `null` = detección automática en el nodo `compute`. Ver
  // `PRIMARY_OBJECTIVE_OPTIONS` arriba para el vocabulario cerrado.
  primary_action_type: string | null
}

// A `clients` row joined with its `client_paid_media` extension (active
// clients only). PM, operator, status and web/IG are client-level fields now.
export interface PaidMediaClientRow {
  id: string
  company_name: string
  website_url: string | null
  instagram_url: string | null
  pm_name: string | null
  operator_name: string | null
  status: string | null // key into `paid_media_client_status`
  // Portal clients (Grupo Norte, Viviera) keep an admin-only name (DB guard trigger).
  portal_enabled: boolean
}

// Minimal client shape for `ClientPicker`: the picker commits ids, never names.
export interface ClientOption {
  id: string
  name: string
}

// One row per client in the Clientes list. Clients drive the groups, so a
// client with zero accounts still appears (see `src/lib/paid-media/group.ts`).
export interface ClientGroup {
  clientId: string
  clientName: string
  portalEnabled: boolean
  status: string | null
  websiteUrl: string | null
  instagramUrl: string | null
  accounts: AdAccountRow[] // ordered by name
  platforms: Platform[] // distinct, drives the platform chips
  pmName: string | null
  operatorName: string | null
  // Per-currency subtotals, not a single summed total (spec: "client totals
  // are per-currency subtotals"). ARS first when both are present.
  budgetByCurrency: { currency: Currency; total: number }[]
}
