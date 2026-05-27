'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { LeadInfoPanel } from './LeadInfoPanel'
import { MessageBubble } from './MessageBubble'
import { ActionButtons } from './ActionButtons'
import type { Lead, Message } from '@/lib/crm/types'

function dateSeparatorLabel(iso: string): string {
  const msgDate = new Date(iso)
  const today = new Date()
  const diffDays = Math.floor(
    (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) -
      Date.UTC(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate())) /
      86_400_000,
  )
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  return msgDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

function toDateKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export function ConversationView({ lead, messages }: { lead: Lead; messages: Message[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col gap-4 p-6"
    >
      <Link
        href="/dashboard/chatbot/crm"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al CRM
      </Link>

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-1">
          <LeadInfoPanel lead={lead} />
          <ActionButtons
            sessionId={lead.session_id}
            stage={lead.stage}
            phone={lead.contacto}
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-muted/20 lg:col-span-2">
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4 scrollbar-themed">
            {messages.length === 0 ? (
              <p className="m-auto text-sm text-muted-foreground">Sin mensajes todavía</p>
            ) : (
              (() => {
                const seen = new Set<string>()
                return messages.flatMap((m) => {
                  const elements = []
                  if (m.created_at) {
                    const key = toDateKey(m.created_at)
                    if (!seen.has(key)) {
                      seen.add(key)
                      elements.push(
                        <div key={`sep-${key}`} className="my-2 flex items-center gap-2">
                          <div className="h-px flex-1 bg-border" />
                          <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
                            {dateSeparatorLabel(m.created_at)}
                          </span>
                          <div className="h-px flex-1 bg-border" />
                        </div>,
                      )
                    }
                  }
                  elements.push(<MessageBubble key={m.id} message={m} />)
                  return elements
                })
              })()
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
