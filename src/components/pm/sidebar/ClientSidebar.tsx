import { createClient } from '@/app/utils/supabase/server'
import { getClientsWithStatus } from '@/lib/pm/queries'
import { ClientList } from './ClientList'

function AvalonLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 177.7 76.9"
        height={26}
        aria-hidden="true"
        style={{ width: 'auto' }}
      >
        <path fill="#6900ff" d="M67,0v76.9H4.3L65.3,0h1.7ZM60.4,69.5V15.4l-41.8,54.2h41.8Z" />
        <path fill="#111827" d="M85.2,2.3h7.7v66.2L138.7,2.2h8l.2.2h.2c-17.1,24.8-34.2,49.6-51.2,74.5h-10.3l-.4-.5V4.8h0v-2.5h0Z" />
        <rect fill="#6900ff" x="140.3" y="42.4" width="37.4" height="7.3" />
        <rect fill="#6900ff" x="110.1" y="28.9" width="67.5" height="7.3" />
        <rect fill="#6900ff" x="110.1" y="55.9" width="67.5" height="7.3" />
      </svg>
      <span className="font-unbounded text-base font-bold text-text leading-snug">
        Clientes PM
      </span>
    </div>
  )
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  )
}

export async function ClientSidebar({ gids }: { gids: string[] }) {
  const supabase = await createClient()
  const clients = await getClientsWithStatus(supabase, gids)

  return (
    <aside className="w-[260px] h-full bg-sidebar border-r border-border flex flex-col flex-shrink-0">
      <div className="px-4 py-5 border-b border-border flex items-center">
        <AvalonLogo />
      </div>

      <p className="px-4 pt-4 pb-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider font-poppins">
        Clientes
      </p>

      <ClientList clients={clients} />

      <div className="border-t border-border px-2 py-3">
        <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-item text-text-secondary hover:bg-purple-50 hover:text-brand transition-colors font-poppins text-xs">
          <SettingsIcon />
          Configuración
        </button>
      </div>
    </aside>
  )
}
