'use client'

import { useEffect } from 'react'
import { useDashboardData } from '@/contexts/DashboardDataContext'

interface ClientSyncProps {
  clientId: string
}

/**
 * Mounted in /dashboard/pm/[id] pages. Reads the route param and syncs the
 * dashboard's selected client in DashboardDataContext if it doesn't match,
 * so the global dropdown reflects the current URL.
 */
export function ClientSync({ clientId }: ClientSyncProps) {
  const { clients, selectedClient, setSelectedClient } = useDashboardData()

  useEffect(() => {
    if (!clientId) return
    if (selectedClient?.id === clientId) return
    const found = (clients ?? []).find((c: { id: string }) => c.id === clientId)
    if (found) setSelectedClient(found)
  }, [clientId, clients, selectedClient, setSelectedClient])

  return null
}
