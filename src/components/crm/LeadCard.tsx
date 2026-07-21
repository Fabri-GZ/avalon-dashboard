'use client'

import Link from 'next/link'
import { LuUser as User, LuGripVertical as GripVertical } from 'react-icons/lu'
import { useDraggable } from '@dnd-kit/react'
import { Feedback } from '@dnd-kit/dom'
import { relativeTime, initials } from '@/lib/crm/format'
import { LeadBadges } from './LeadBadges'
import type { Lead } from '@/lib/crm/types'

export function LeadCard({ lead, isDragActive }: { lead: Lead; isDragActive?: boolean }) {
  const { ref, handleRef, isDragging } = useDraggable({
    id: lead.session_id,
    plugins: [Feedback.configure({ feedback: 'clone' })],
  })

  const avatar = initials(lead.nombre)
  const primary = lead.nombre || lead.contacto || lead.session_id
  const showContacto = Boolean(lead.nombre && lead.contacto)

  return (
    // v2: ref is a callback ref — library applies transform directly to the DOM element
    <div
      ref={ref}
      className={`rounded-lg transition-opacity duration-150 ${
        isDragging ? 'opacity-40' : isDragActive ? 'opacity-60' : 'opacity-100'
      }`}
    >
      <Link
        href={`/dashboard/chatbot/crm/${lead.session_id}`}
        className={`block rounded-lg border border-border bg-card p-3 shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md ${
          isDragging ? 'border-dashed' : ''
        }`}
      >
        <div className="flex items-start gap-2">
          <button
            ref={handleRef}
            type="button"
            aria-label="Arrastrar lead"
            onClick={(e) => e.preventDefault()}
            className="-ml-1 flex h-9 w-5 shrink-0 touch-none items-center justify-center rounded text-muted-foreground/40 transition-colors hover:text-muted-foreground cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
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
          <LeadBadges lead={lead} />
          <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
            {relativeTime(lead.last_message_at)}
          </span>
        </div>
      </Link>
    </div>
  )
}
