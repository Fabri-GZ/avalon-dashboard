'use client'

import Link from 'next/link'
import { User } from 'lucide-react'
import { relativeTime, initials } from '@/lib/crm/format'
import type { Lead } from '@/lib/crm/types'

const INTENCION_STYLE: Record<string, { label: string; className: string }> = {
  presupuesto: {
    label: 'Presupuesto',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  },
  postventa: {
    label: 'Postventa',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
  },
  otro: {
    label: 'Otro',
    className: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300',
  },
}

export function LeadCard({ lead }: { lead: Lead }) {
  const avatar = initials(lead.nombre)
  const primary = lead.nombre || lead.contacto || lead.session_id
  const showContacto = Boolean(lead.nombre && lead.contacto)

  return (
    <Link
      href={`/dashboard/chatbot/crm/${lead.session_id}`}
      className="block rounded-lg border border-border bg-card p-3 shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
          {avatar === '?' ? <User className="h-4 w-4" /> : avatar}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{primary}</p>
          {showContacto && (
            <p className="truncate text-xs text-muted-foreground">{lead.contacto}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        {lead.intencion ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              INTENCION_STYLE[lead.intencion]?.className ??
              'bg-muted text-muted-foreground'
            }`}
          >
            {INTENCION_STYLE[lead.intencion]?.label ?? lead.intencion}
          </span>
        ) : (
          <span />
        )}
        <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
          {relativeTime(lead.last_message_at)}
        </span>
      </div>
    </Link>
  )
}
