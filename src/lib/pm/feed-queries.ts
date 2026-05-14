import { createClient as createServerClient } from '@/app/utils/supabase/server'
import type { FeedData, FeedItem, FeedStats } from './types'

type ServerClient = Awaited<ReturnType<typeof createServerClient>>

type Scope = {
  /** When provided, queries are restricted to clients whose asana_project_id is in this list. */
  gids: string[] | null
}

const ONE_WEEK_DAYS = 7

function todayIso(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function plusDaysIso(days: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime()
  return Math.round(ms / 86_400_000)
}

async function getScopedClientIds(
  supabase: ServerClient,
  scope: Scope
): Promise<{ ids: string[] | null; namesById: Map<string, string> }> {
  if (scope.gids === null) {
    const { data } = await supabase.from('pm_clients').select('id, name')
    const namesById = new Map<string, string>((data ?? []).map((c) => [c.id, c.name]))
    return { ids: null, namesById }
  }
  if (scope.gids.length === 0) {
    return { ids: [], namesById: new Map() }
  }
  const { data } = await supabase
    .from('pm_clients')
    .select('id, name')
    .in('asana_project_id', scope.gids)
  const namesById = new Map<string, string>((data ?? []).map((c) => [c.id, c.name]))
  return { ids: (data ?? []).map((c) => c.id), namesById }
}

async function getOverdueTasks(
  supabase: ServerClient,
  clientIds: string[] | null,
  namesById: Map<string, string>
): Promise<FeedItem[]> {
  const today = todayIso()
  let q = supabase
    .from('pm_tasks')
    .select('id, client_id, name, due_date, field_prioridad, section_id')
    .eq('completed', false)
    .lt('due_date', today)
    .order('due_date', { ascending: true })

  if (clientIds !== null) {
    if (clientIds.length === 0) return []
    q = q.in('client_id', clientIds)
  }

  const { data } = await q
  return (data ?? []).map((t) => ({
    id: t.id,
    clientId: t.client_id,
    clientName: namesById.get(t.client_id) ?? '—',
    title: t.name,
    badge: 'overdue',
    dueDate: t.due_date,
    daysOverdue: t.due_date ? daysBetween(t.due_date, today) : undefined,
    priority: t.field_prioridad,
  }))
}

async function getDueThisWeek(
  supabase: ServerClient,
  clientIds: string[] | null,
  namesById: Map<string, string>
): Promise<FeedItem[]> {
  const today = todayIso()
  const horizon = plusDaysIso(ONE_WEEK_DAYS)
  let q = supabase
    .from('pm_tasks')
    .select('id, client_id, name, due_date, field_prioridad')
    .eq('completed', false)
    .gte('due_date', today)
    .lte('due_date', horizon)
    .order('due_date', { ascending: true })

  if (clientIds !== null) {
    if (clientIds.length === 0) return []
    q = q.in('client_id', clientIds)
  }

  const { data } = await q
  return (data ?? []).map((t) => ({
    id: t.id,
    clientId: t.client_id,
    clientName: namesById.get(t.client_id) ?? '—',
    title: t.name,
    badge: 'due',
    dueDate: t.due_date,
    daysUntilDue: t.due_date ? daysBetween(today, t.due_date) : undefined,
    priority: t.field_prioridad,
  }))
}

async function getSetupPending(
  supabase: ServerClient,
  clientIds: string[] | null,
  namesById: Map<string, string>
): Promise<FeedItem[]> {
  if (clientIds !== null && clientIds.length === 0) return []

  // Clients without any brief
  let cq = supabase.from('pm_briefs').select('client_id')
  if (clientIds !== null) cq = cq.in('client_id', clientIds)
  const { data: briefs } = await cq
  const clientsWithBrief = new Set<string>((briefs ?? []).map((b) => b.client_id))
  const allClientIds = clientIds ?? Array.from(namesById.keys())
  const setup: FeedItem[] = allClientIds
    .filter((cid) => !clientsWithBrief.has(cid))
    .map((cid) => ({
      id: `no-brief:${cid}`,
      clientId: cid,
      clientName: namesById.get(cid) ?? '—',
      title: 'Cliente sin brief inicial',
      badge: 'brief',
    }))

  // Briefs without report
  let bq = supabase.from('pm_briefs').select('id, client_id, created_at')
  if (clientIds !== null) bq = bq.in('client_id', clientIds)
  const { data: briefRows } = await bq

  if (briefRows && briefRows.length > 0) {
    const briefIds = briefRows.map((b) => b.id)
    const { data: reports } = await supabase
      .from('pm_reports')
      .select('brief_id')
      .in('brief_id', briefIds)
    const reportedBriefIds = new Set<string>(
      (reports ?? []).map((r) => r.brief_id).filter(Boolean) as string[]
    )
    for (const b of briefRows) {
      if (!reportedBriefIds.has(b.id)) {
        setup.push({
          id: `no-report:${b.id}`,
          clientId: b.client_id,
          clientName: namesById.get(b.client_id) ?? '—',
          title: 'Brief sin reporte generado',
          badge: 'report',
        })
      }
    }
  }

  return setup
}

async function getStats(
  immediate: FeedItem[],
  thisWeek: FeedItem[],
  setup: FeedItem[],
  activeClients: number
): Promise<FeedStats> {
  const withoutBrief = setup.filter((i) => i.badge === 'brief').length
  return {
    overdue: immediate.length,
    thisWeek: thisWeek.length,
    withoutBrief,
    activeClients,
  }
}

/**
 * Build the actionable feed for the PM dashboard landing page.
 * - `scope.gids = string[]` → restrict to those Asana project gids (role=pm)
 * - `scope.gids = null` → all clients (role=admin_global)
 */
export async function getFeedData(
  supabase: ServerClient,
  scope: Scope
): Promise<FeedData> {
  const { ids: clientIds, namesById } = await getScopedClientIds(supabase, scope)

  const [immediate, thisWeek, setup] = await Promise.all([
    getOverdueTasks(supabase, clientIds, namesById),
    getDueThisWeek(supabase, clientIds, namesById),
    getSetupPending(supabase, clientIds, namesById),
  ])

  const stats = await getStats(immediate, thisWeek, setup, namesById.size)

  return {
    stats,
    groups: { immediate, thisWeek, setup },
  }
}
