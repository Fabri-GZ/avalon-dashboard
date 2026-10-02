import { createClient } from '@/app/utils/supabase/server'
import { fetchAccountsWithReports } from '@/lib/paid-media/reports-presence'
import { PapeleraView } from '@/components/paid-media/PapeleraView'
import type { Platform } from '@/lib/paid-media/types'

// Server Component: el guard de ruta lo hace el middleware, heredado del
// prefijo `/dashboard/paid-media` (ROUTE_SECTION_MAP → PAID_MEDIA_CLIENTES).
// No hay entrada propia en ese mapa ni una nueva section key: esta ruta
// vive bajo Clientes.

export interface TrashRow {
  id: string
  name: string
  clientName: string | null
  platform: Platform
  /** Computed server-side to avoid hydration drift from `new Date()`. */
  deletedDaysAgo: number
}

function daysAgo(iso: string): number {
  const deletedAt = new Date(iso).getTime()
  const now = Date.now()
  return Math.max(0, Math.floor((now - deletedAt) / (1000 * 60 * 60 * 24)))
}

/** A trashed client with the accounts that went to the papelera together with it. */
export interface TrashClientRow {
  id: string
  name: string
  deletedDaysAgo: number
  accounts: TrashRow[]
}

export default async function PapeleraPage() {
  const supabase = await createClient()

  const [accountsRes, clientsRes, accountsWithReports] = await Promise.all([
    supabase
      .from('ad_accounts')
      .select('id, name, client_id, client_name, platform, deleted_at')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }),
    supabase
      .from('client_paid_media')
      .select('client_id, deleted_at, clients!inner(company_name)')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }),
    fetchAccountsWithReports(supabase),
  ])

  // Cascade = the account carries the exact timestamp the client was trashed
  // with (trash_paid_media_client stamps both with one now()). Same column type
  // on both sides, so string equality is exact. An account trashed on its own
  // earlier keeps another value and is listed individually.
  const clientDeletedAt = new Map<string, string>()
  const clients: TrashClientRow[] = (clientsRes.data ?? []).map((ext) => {
    const joined = Array.isArray(ext.clients) ? ext.clients[0] : ext.clients
    clientDeletedAt.set(ext.client_id, ext.deleted_at as string)
    return {
      id: ext.client_id,
      name: joined?.company_name ?? '—',
      deletedDaysAgo: daysAgo(ext.deleted_at as string),
      accounts: [],
    }
  })
  const clientById = new Map(clients.map((c) => [c.id, c]))

  const rows: TrashRow[] = []
  for (const account of accountsRes.data ?? []) {
    const row: TrashRow = {
      id: account.id,
      name: account.name,
      clientName: account.client_name,
      platform: account.platform as Platform,
      deletedDaysAgo: daysAgo(account.deleted_at as string),
    }
    const owner = account.client_id ? clientById.get(account.client_id) : undefined
    if (owner && clientDeletedAt.get(owner.id) === account.deleted_at) owner.accounts.push(row)
    else rows.push(row)
  }

  return <PapeleraView clients={clients} rows={rows} accountsWithReports={accountsWithReports} />
}
