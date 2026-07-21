'use client'

import { useEffect, useRef } from 'react'
import { useDashboardData } from '@/contexts/DashboardDataContext'

interface CrmClientSyncProps {
  clientId: string
}

/**
 * Mounted in /dashboard/chatbot/crm. Mirrors the server-resolved `client_id`
 * (already validated by `resolveClientId`, honoring `?client=` only for
 * admin_global) into the dashboard's selected-client context, so the
 * `CompanySwitcher` in the sidebar shows the same client the CRM board is
 * actually rendering.
 *
 * Copy of `src/components/pm/ClientSync.tsx`'s pattern: `lastSyncedRef`
 * excludes `selectedClient` from the effect deps on purpose, so this doesn't
 * fight the dropdown when the user picks another client -- the dropdown
 * navigates, which changes `clientId`, which then re-triggers this effect.
 */
export function CrmClientSync({ clientId }: CrmClientSyncProps) {
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
