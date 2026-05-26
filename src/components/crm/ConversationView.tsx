'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { LeadInfoPanel } from './LeadInfoPanel'
import { MessageBubble } from './MessageBubble'
import type { Lead, Message } from '@/lib/crm/types'

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
        <div className="lg:col-span-1">
          <LeadInfoPanel lead={lead} />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-muted/20 lg:col-span-2">
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4 scrollbar-themed">
            {messages.length === 0 ? (
              <p className="m-auto text-sm text-muted-foreground">Sin mensajes todavía</p>
            ) : (
              messages.map((m) => <MessageBubble key={m.id} message={m} />)
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
