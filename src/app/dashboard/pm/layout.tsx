import { after } from 'next/server'
import { triggerSync } from '@/lib/asana/sync'
import { ClientSidebar } from '@/components/pm/sidebar/ClientSidebar'
import { PMShell } from '@/components/pm/PMShell'

export default function PMLayout({ children }: { children: React.ReactNode }) {
  after(() => triggerSync())

  return (
    <PMShell>
      {/* Escape the dashboard main's p-4 lg:p-6 padding and fill the content area */}
      <div
        className="-m-4 lg:-m-6 flex overflow-hidden"
        style={{ height: 'calc(100dvh - 95px)' }}
      >
        <ClientSidebar />
        <main className="flex-1 min-w-0 overflow-y-auto" style={{ backgroundColor: '#F4F3F8' }}>
          {children}
        </main>
      </div>
    </PMShell>
  )
}
