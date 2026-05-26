'use client'

import { cleanMessage } from '@/lib/crm/format'
import type { Message } from '@/lib/crm/types'

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const text = cleanMessage(message.content)
  if (!text) return null

  return (
    <div className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[78%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'rounded-bl-md border border-border bg-card text-foreground'
            : 'rounded-br-md bg-primary text-primary-foreground'
        }`}
      >
        {text}
      </div>
    </div>
  )
}
