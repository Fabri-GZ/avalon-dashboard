'use client'

import { motion } from 'framer-motion'
import { LuSparkles } from 'react-icons/lu'

export type MessageRole = 'user' | 'agent'

export interface Message {
  id: string
  role: MessageRole
  content: string
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex justify-end"
      >
        <div className="max-w-[82%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm">
          {message.content}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex items-start gap-2.5"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <LuSparkles className="h-4 w-4" />
      </span>
      <div className="max-w-[82%] rounded-2xl rounded-tl-md border border-border/70 bg-card px-4 py-2.5 text-sm leading-relaxed text-foreground shadow-sm">
        {message.content}
      </div>
    </motion.div>
  )
}
