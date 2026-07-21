import type { Channel, CrmDateRange, Lead, LeadDetails, Message, Stage } from './types'
import { createClient as createServerClient } from '@/app/utils/supabase/server'

type ServerClient = Awaited<ReturnType<typeof createServerClient>>

// `clients(client_key)` is a to-one embed over the `leads.client_id ->
// clients.id` FK -- PostgREST returns it as a single nested object, not an
// array, because that FK is not ambiguous (see `src/app/api/pm/tasks/[gid]/
// route.ts` for the same embed pattern against `pm_clients`).
const LEAD_FIELDS =
  'client_id, channel, session_id, nombre, contacto, stage, intencion, derivado, last_snippet, first_contact_at, last_message_at, calificado, details, clients(client_key)'

type LeadRow = {
  client_id: string
  channel: Channel
  session_id: string
  nombre: string | null
  contacto: string | null
  stage: Stage
  intencion: string | null
  derivado: boolean | null
  last_snippet: string | null
  first_contact_at: string | null
  last_message_at: string | null
  calificado: boolean | null
  details: LeadDetails | null
  clients: { client_key: string | null } | null
}

// Replaces the transitional `flattenLead` (PR3): `Lead.details` is now the
// raw jsonb (registry-driven, see `registry.ts`) and `client_key` comes from
// the `clients` embed instead of a per-client flattened shape.
function toLead(row: LeadRow): Lead {
  return {
    client_id: row.client_id,
    client_key: row.clients?.client_key ?? '',
    channel: row.channel,
    session_id: row.session_id,
    nombre: row.nombre,
    contacto: row.contacto,
    stage: row.stage,
    intencion: row.intencion,
    derivado: row.derivado,
    calificado: row.calificado,
    last_snippet: row.last_snippet,
    first_contact_at: row.first_contact_at,
    last_message_at: row.last_message_at,
    details: row.details ?? {},
  }
}

type LeadsQueryOpts = {
  channel?: Channel
  dateRange?: CrmDateRange
}

// Page size for a kanban column. Fixed, not configurable: it is tied 1:1 to
// the "cargar más" button, which grows the window by exactly one page.
export const CRM_LEADS_PAGE_SIZE = 25

export interface LeadsColumnResult {
  leads: Lead[]
  hasMore: boolean
}

type ColumnQueryOpts = LeadsQueryOpts & {
  stage: Stage
  /**
   * How many pages of `CRM_LEADS_PAGE_SIZE` the column should return, 1-based.
   *
   * A column always shows a *prefix* of the ordering -- "cargar más" only ever
   * extends the window downward, never jumps into the middle of it. So the
   * whole window is one `limit(pages * PAGE_SIZE)` over the already-ordered
   * index, and a page count is the entire state the URL has to carry.
   *
   * This deliberately replaces a keyset cursor. A cursor only knows how to
   * take one step, so restoring the window after a reload meant replaying every
   * page in sequence -- up to 40 round trips to rebuild what a single query
   * returns. Keyset earns its keep when you page forward and discard what you
   * passed; here the server re-renders the full prefix on every param change,
   * so there is nothing for it to buy. `offset` is not involved either: this
   * is a plain prefix scan on `leads_board_idx`, with no rows skipped over.
   */
  pages?: number
  /** Server-side search term (nombre/contacto). Replaces the in-memory filter
   * the board used to do, which could only ever see the rows already loaded. */
  q?: string
}

// PostgREST's `.or()` mini-language treats `,` as the condition separator and
// `()` as grouping. A search term or a `session_id` could contain either.
// Wrapping the value in double quotes makes it opaque to that parser;
// embedded backslashes/quotes still need manual escaping per PostgREST's
// documented convention. This does NOT need to happen for `.eq()`/`.lt()`
// used outside `.or()` -- those go through supabase-js's normal param
// encoding, only the embedded mini-language inside `.or()` needs it.
function quoteOrValue(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

// Treat the user's search term as a literal substring, not a LIKE pattern --
// a lead named "50%_off" shouldn't need to be searched as a wildcard.
function escapeIlikeTerm(term: string): string {
  return term.replace(/[%_]/g, (c) => `\\${c}`)
}

function buildNameContactFilter(term: string): string {
  const pattern = quoteOrValue(`%${escapeIlikeTerm(term)}%`)
  return `nombre.ilike.${pattern},contacto.ilike.${pattern}`
}

// Clamped, because `pages` comes straight off the URL and a hand-edited
// `?pages_conversando=99999` would otherwise ask Postgres for 2.5M rows.
const MAX_COLUMN_PAGES = 40

export function parseColumnPages(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? '', 10)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(n, MAX_COLUMN_PAGES)
}

function dateRangeThreshold(dateRange: Exclude<CrmDateRange, 'todo'>): string {
  const DAYS: Record<Exclude<CrmDateRange, 'todo'>, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  }
  const threshold = new Date()
  threshold.setDate(threshold.getDate() - DAYS[dateRange])
  return threshold.toISOString()
}

// A kanban column: a prefix of `(last_message_at desc nulls last, session_id
// desc)` for one stage, `pages` pages long. One query, no cursor replay.
export async function getLeadsColumn(
  supabase: ServerClient,
  clientId: string,
  opts: ColumnQueryOpts,
): Promise<LeadsColumnResult> {
  const { channel = 'whatsapp', dateRange = '30d', stage, pages = 1, q } = opts
  const windowSize = Math.min(Math.max(pages, 1), MAX_COLUMN_PAGES) * CRM_LEADS_PAGE_SIZE

  let query = supabase
    .from('leads')
    .select(LEAD_FIELDS)
    .eq('client_id', clientId)
    .eq('channel', channel)
    .eq('stage', stage)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    // session_id breaks ties so the ordering is total. Without it, two leads
    // sharing a last_message_at could swap places between two requests, and
    // the window would silently drop one and repeat another.
    .order('session_id', { ascending: false })

  if (dateRange !== 'todo') {
    query = query.gte('last_message_at', dateRangeThreshold(dateRange))
  }

  const term = q?.trim()
  if (term) {
    // Not covered by `leads_board_idx`: this is a seq scan today, which is
    // fine at a few hundred leads per client. A trigram index
    // (`gin (nombre gin_trgm_ops)`) is deliberately deferred until a client
    // approaches ~5k rows -- see design D5. Do not add it preemptively.
    query = query.or(buildNameContactFilter(term))
  }

  // One extra row answers "is there another page?" without a second round trip
  // or a COUNT.
  const { data, error } = await query.limit(windowSize + 1)
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as unknown as LeadRow[]
  const hasMore = rows.length > windowSize

  return {
    leads: (hasMore ? rows.slice(0, windowSize) : rows).map(toLead),
    hasMore,
  }
}

// Wired into `crm/page.tsx`: the kanban header count per column comes from
// here (exact count), independent of how many rows that column has loaded.
export async function getStageCounts(
  supabase: ServerClient,
  clientId: string,
  channel: Channel = 'whatsapp',
  // PR4 addition, optional and defaulted so the PR3 call shape (3 args) keeps
  // working unchanged. Both filters have to mirror what the paginated overload
  // of `getLeadsPage` applies, or a column header advertises a total that
  // "load more" can never reach: the list is filtered to a date window and the
  // count is not, so the header reads high and the column just stops early.
  q?: string,
  dateRange: CrmDateRange = '30d',
): Promise<Record<Stage, number>> {
  const stages: Stage[] = ['conversando', 'derivado', 'cerrado']
  const term = q?.trim()

  const counts = await Promise.all(
    stages.map(async (stage) => {
      let query = supabase
        .from('leads')
        .select('session_id', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('channel', channel)
        .eq('stage', stage)

      if (dateRange !== 'todo') {
        query = query.gte('last_message_at', dateRangeThreshold(dateRange))
      }

      if (term) {
        query = query.or(buildNameContactFilter(term))
      }

      const { count, error } = await query
      if (error) throw new Error(error.message)
      return [stage, count ?? 0] as const
    }),
  )

  return Object.fromEntries(counts) as Record<Stage, number>
}

export async function getLeadWithMessages(
  supabase: ServerClient,
  clientId: string,
  sessionId: string,
  channel: Channel = 'whatsapp',
): Promise<{ lead: Lead; messages: Message[] } | null> {
  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select(LEAD_FIELDS)
    .eq('client_id', clientId)
    .eq('channel', channel)
    .eq('session_id', sessionId)
    .maybeSingle()

  if (leadErr) throw new Error(leadErr.message)
  if (!lead) return null

  const { data: messages, error: msgErr } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('client_id', clientId)
    .eq('channel', channel)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true })

  if (msgErr) throw new Error(msgErr.message)

  return {
    lead: toLead(lead as unknown as LeadRow),
    messages: (messages ?? []) as unknown as Message[],
  }
}
