'use client'

import type { ReactNode } from 'react'
import { cleanMessage } from '@/lib/crm/format'
import type { Message } from '@/lib/crm/types'

function renderWA(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  const regex = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g
  let last = 0
  let key = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const token = match[0]
    const inner = token.slice(1, -1)
    if (token[0] === '*') parts.push(<strong key={key++}>{inner}</strong>)
    else if (token[0] === '_') parts.push(<em key={key++}>{inner}</em>)
    else parts.push(<s key={key++}>{inner}</s>)
    last = match.index + token.length
  }

  if (last < text.length) parts.push(text.slice(last))
  return parts
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const text = cleanMessage(message.content)
  if (!text) return null

  const time = message.created_at ? formatTime(message.created_at) : null

  return (
    <div className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[78%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'rounded-bl-md border border-border bg-card text-foreground'
            : 'rounded-br-md bg-primary text-primary-foreground'
        }`}
      >
        {renderWA(text)}
        {time && (
          <span
            className={`mt-1 block text-right text-[10px] leading-none ${
              isUser ? 'text-muted-foreground' : 'text-primary-foreground/60'
            }`}
          >
            {time}
          </span>
        )}
      </div>
    </div>
  )
}
