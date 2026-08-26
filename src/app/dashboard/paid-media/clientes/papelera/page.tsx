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

export default async function PapeleraPage() {
  const supabase = await createClient()

  const [accountsRes, accountsWithReports] = await Promise.all([
    supabase
      .from('ad_accounts')
      .select('id, name, client_name, platform, deleted_at')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }),
    fetchAccountsWithReports(supabase),
  ])

  const rows: TrashRow[] = (accountsRes.data ?? []).map((account) => ({
    id: account.id,
    name: account.name,
    clientName: account.client_name,
    platform: account.platform as Platform,
    deletedDaysAgo: daysAgo(account.deleted_at as string),
  }))

  return <PapeleraView rows={rows} accountsWithReports={accountsWithReports} />
}
