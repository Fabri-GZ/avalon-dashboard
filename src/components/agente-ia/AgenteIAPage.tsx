'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { LuSparkles } from 'react-icons/lu'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ResultsGrid } from './ResultsGrid'
import { ConfirmResetSheet } from './ConfirmResetSheet'
import { useJobPolling } from '@/hooks/useJobPolling'
import type { Department, EnqueueResponse, TrendResponse } from '@/lib/agente-ia/types'
import type { Message } from './ChatMessage'

interface AgenteIAPageProps {
  initialDepartment?: Department
}

interface ChatEntry {
  userMessage: Message
  agentMessage?: Message
  results?: TrendResponse
}

const SUGGESTIONS = [
  'Trends de gastronomía esta semana',
  'Hashtags para un lanzamiento',
  'Qué está funcionando en Reels',
  'Ideas para un carrusel',
]

function newSessionId() {
  return crypto.randomUUID()
}

function greeting() {
  const h = new Date().getHours()
  if (h >= 6 && h < 13) return 'Buen día'
  if (h >= 13 && h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export function AgenteIAPage({ initialDepartment = 'cm' }: AgenteIAPageProps) {
  const [department, setDepartment] = useState<Department>(initialDepartment)
  const [pendingDept, setPendingDept] = useState<Department | null>(null)
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [input, setInput] = useState('')
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState(newSessionId)
  const bottomRef = useRef<HTMLDivElement>(null)

  const hasConversation = entries.length > 0
  // En vuelo = la última entry todavía no tiene respuesta del agente. Cubre tanto
  // el despacho del POST como el polling, sin un estado extra que sincronizar.
  const loading = hasConversation && !entries[entries.length - 1].agentMessage

  // El polling vive en el hook: cuando el job resuelve, volcamos el resultado
  // (o el error) en la última entry vía estos handlers. Sin effect en la página.
  useJobPolling(activeJobId, {
    onDone: (result) => {
      patchLastEntry({
        agentMessage: { id: crypto.randomUUID(), role: 'agent', content: result.reply },
        results: result,
      })
      setActiveJobId(null)
      scrollToBottom(100)
    },
    onError: (message) => {
      patchLastEntry({
        agentMessage: { id: crypto.randomUUID(), role: 'agent', content: message },
      })
      setActiveJobId(null)
    },
  })

  function handleDepartmentChange(dept: Department) {
    if (dept === department) return
    if (hasConversation) setPendingDept(dept)
    else setDepartment(dept)
  }

  function confirmReset() {
    if (!pendingDept) return
    setDepartment(pendingDept)
    setPendingDept(null)
    setEntries([])
    setInput('')
    setActiveJobId(null)
    setSessionId(newSessionId())
  }

  function cancelReset() {
    setPendingDept(null)
  }

  function scrollToBottom(delay = 50) {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), delay)
  }

  function patchLastEntry(patch: Partial<ChatEntry>) {
    setEntries((prev) => {
      const updated = [...prev]
      updated[updated.length - 1] = { ...updated[updated.length - 1], ...patch }
      return updated
    })
  }

  async function handleSubmit(text?: string) {
    const trimmed = (text ?? input).trim()
    if (!trimmed || loading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    setEntries((prev) => [...prev, { userMessage: userMsg }])
    setInput('')
    scrollToBottom()

    try {
      const res = await fetch('/api/agente-ia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department, message: trimmed, sessionId }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error desconocido' }))
        patchLastEntry({
          agentMessage: {
            id: crypto.randomUUID(),
            role: 'agent',
            content: err.error ?? 'Ocurrió un error. Intentá de nuevo.',
          },
        })
        scrollToBottom(100)
        return
      }

      // El route encola el job y devuelve el jobId: el resultado llega por polling.
      const { jobId }: EnqueueResponse = await res.json()
      setActiveJobId(jobId)
      scrollToBottom(100)
    } catch {
      patchLastEntry({
        agentMessage: {
          id: crypto.randomUUID(),
          role: 'agent',
          content: 'Error de conexión. Verificá tu red e intentá de nuevo.',
        },
      })
      scrollToBottom(100)
    }
  }

  return (
    <div className="flex h-[calc(100dvh-95px-2rem)] flex-col lg:h-[calc(100dvh-95px-3rem)]">
      {pendingDept && <ConfirmResetSheet onConfirm={confirmReset} onCancel={cancelReset} />}

      {!hasConversation ? (
        // Empty state: saludo + composer centrado (estilo conversacional)
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-2xl"
          >
            <div className="mb-7 flex flex-col items-center gap-4 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LuSparkles className="h-7 w-7" />
              </span>
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {greeting()}. ¿Qué investigamos?
                </h2>
                <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                  Tirame un rubro o un hashtag y te traigo los reels y posteos que están rompiendo
                  estos días, ordenados por tracción real, no por likes viejos.
                </p>
              </div>
            </div>

            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              department={department}
              onDepartmentChange={handleDepartmentChange}
              disabled={loading}
            />

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSubmit(s)}
                  className="rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      ) : (
        // Conversación activa: mensajes scrolleables + composer anclado abajo
        <>
          <div className="scrollbar-themed flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto flex max-w-3xl flex-col gap-6">
              {entries.map((entry) => (
                <div key={entry.userMessage.id} className="flex flex-col gap-4">
                  <ChatMessage message={entry.userMessage} />
                  {entry.agentMessage && <ChatMessage message={entry.agentMessage} />}
                  {entry.results && (
                    <ResultsGrid results={entry.results.results} meta={entry.results.meta} />
                  )}
                </div>
              ))}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="relative px-4 pt-2">
            {/* fade que disuelve los mensajes hacia el composer */}
            <div className="pointer-events-none absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-secondary to-transparent" />
            <div className="mx-auto max-w-3xl">
              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={handleSubmit}
                department={department}
                onDepartmentChange={handleDepartmentChange}
                disabled={loading}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2.5"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <LuSparkles className="h-4 w-4" />
      </span>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-border/70 bg-card px-4 py-3 shadow-sm">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-muted-foreground/50"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  )
}
