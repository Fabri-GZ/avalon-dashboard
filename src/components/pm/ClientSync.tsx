'use client'

import { useEffect, useRef } from 'react'
import { useDashboardData } from '@/contexts/DashboardDataContext'

interface ClientSyncProps {
  clientId: string
}

/**
 * Mounted in /dashboard/pm/[id] pages. Syncs the dashboard's selected client
 * with the route param ONCE per route change. We intentionally exclude
 * `selectedClient` from the dependency list to avoid fighting against the
 * dropdown when the user picks another client — the dropdown navigates,
 * which updates `clientId`, which then triggers this effect.
 */
export function ClientSync({ clientId }: ClientSyncProps) {
  const { clients, selectedClient, setSelectedClient } = useDashboardData()
  const lastSyncedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!clientId) return
    if (lastSyncedRef.current === clientId) return
    if (!Array.isArray(clients) || clients.length === 0) return

    const found = clients.find((c: { id: string }) => c.id === clientId)
    if (found && selectedClient?.id !== clientId) {
      setSelectedClient(found)
    }
    lastSyncedRef.current = clientId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, clients])

  return null
}
