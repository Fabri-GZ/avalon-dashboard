'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const TABS = [
  { key: 'tareas',  label: 'Tareas' },
  { key: 'brief',   label: 'Brief' },
  { key: 'reporte', label: 'Reporte' },
] as const

export type TabKey = typeof TABS[number]['key']

export function ClientTabsSkeleton() {
  return (
    <div className="flex bg-card border-b border-border px-7 h-[52px] items-center gap-1">
      {TABS.map(({ key }) => (
        <div
          key={key}
          className="px-5 py-2 rounded-md bg-muted/50 animate-pulse"
          style={{ width: key === 'tareas' ? 68 : key === 'brief' ? 52 : 76, height: 28 }}
        />
      ))}
    </div>
  )
}

export function ClientTabs({ clientId }: { clientId: string }) {
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get('tab') as TabKey) ?? 'tareas'

  return (
    <div className="flex bg-card border-b border-border px-7">
      {TABS.map(({ key, label }) => (
        <Link
          key={key}
          href={`/dashboard/pm/${clientId}?tab=${key}`}
          className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors duration-200 ease-in -mb-px ${
            activeTab === key
              ? 'text-primary border-primary font-bold'
              : 'text-muted-foreground border-transparent hover:text-foreground'
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}
