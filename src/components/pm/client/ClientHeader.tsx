'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { StatusBadge } from '@/components/pm/ui/StatusBadge'
import type { Client, Brief } from '@/lib/pm/types'

function SyncIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={spinning ? 'animate-spin' : ''}
    >
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
    </svg>
  )
}

function ReportIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={spinning ? 'animate-spin' : ''}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  )
}

export function ClientHeader({
  client,
  latestBrief,
}: {
  client: Client
  latestBrief: Brief | null
}) {
  const [loadingReport, setLoadingReport] = useState(false)
  const [loadingSync, setLoadingSync] = useState(false)
  const router = useRouter()

  async function handleSync() {
    setLoadingSync(true)
    try {
      const res = await fetch(`/api/pm/sync-asana?gid=${client.asana_project_id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al sincronizar')
      toast.success(`${client.name} sincronizado con Asana`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al sincronizar')
    } finally {
      setLoadingSync(false)
    }
  }

  async function handleGenerateReport() {
    setLoadingReport(true)
    try {
      const res = await fetch('/api/pm/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: client.id,
          brief_id: latestBrief?.id ?? null,
        }),
      })
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(msg ?? 'Error al generar el reporte')
      }
      router.push(`/dashboard/pm/${client.id}?tab=reporte`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar el reporte')
    } finally {
      setLoadingReport(false)
    }
  }

  return (
    <div className="bg-card border-b border-border px-4 sm:px-7 flex items-center gap-2 sm:gap-3 min-h-[60px]">
      <div className="mr-auto flex-shrink-0">
        <h1 className="font-bold text-sm text-foreground leading-tight">
          {client.name}
        </h1>
      </div>

      <StatusBadge status={client.status} />

      <button
        onClick={handleSync}
        disabled={loadingSync}
        title={loadingSync ? 'Sincronizando...' : 'Sincronizar'}
        className="flex items-center gap-1.5 border border-border hover:border-primary text-muted-foreground hover:text-primary text-xs font-semibold p-2 sm:px-4 sm:py-2 rounded-lg transition-colors duration-200 ease-in disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
      >
        <SyncIcon spinning={loadingSync} />
        <span className="hidden sm:inline">{loadingSync ? 'Sincronizando...' : 'Sincronizar'}</span>
      </button>

      <button
        onClick={handleGenerateReport}
        disabled={loadingReport}
        title={loadingReport ? 'Generando...' : 'Generar Reporte'}
        className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold p-2 sm:px-4 sm:py-2 rounded-lg transition-colors duration-200 ease-in disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
      >
        <ReportIcon spinning={loadingReport} />
        {loadingReport
          ? 'Generando...'
          : <><span className="sm:hidden">Generar</span><span className="hidden sm:inline">Generar Reporte</span></>
        }
      </button>
    </div>
  )
}
