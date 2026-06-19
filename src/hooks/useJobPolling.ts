'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import type { TrendResponse } from '@/lib/agente-ia/types'

const POLL_INTERVAL_MS = 3_000
// El workflow CM tarda ~100s; el peor caso real observado fue ~107s. 140s da
// colchón para hashtags nicho lentos sin colgar al CM indefinidamente.
const TTL_MS = 140_000

export interface JobPollHandlers {
  onDone: (result: TrendResponse) => void
  onError: (message: string) => void
}

/**
 * Pollea `agent_jobs` por jobId vía el browser client (RLS select-own) cada 3s
 * y llama `onDone`/`onError` cuando el job resuelve (o al vencer el TTL de 140s,
 * si n8n cayó sin escribir). Pasá `jobId` null para no pollear.
 *
 * Los handlers se leen por ref, así que cambiar su identidad entre renders no
 * reinicia el polling: el effect depende solo de `jobId`.
 */
export function useJobPolling(jobId: string | null, handlers: JobPollHandlers) {
  const handlersRef = useRef(handlers)
  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    if (!jobId) return

    const supabase = createClient()
    const startedAt = Date.now()
    let active = true
    let timer: ReturnType<typeof setTimeout>

    const expired = () => Date.now() - startedAt > TTL_MS

    async function poll() {
      if (!active) return

      const { data, error } = await supabase
        .from('agent_jobs')
        .select('status, result, error')
        .eq('id', jobId)
        .single()

      if (!active) return

      // Error de lectura (red/transitorio): reintenta hasta agotar el TTL.
      if (error || !data) {
        if (expired()) {
          handlersRef.current.onError('No se pudo leer el estado del job.')
          return
        }
        timer = setTimeout(poll, POLL_INTERVAL_MS)
        return
      }

      if (data.status === 'done') {
        handlersRef.current.onDone(data.result as TrendResponse)
        return
      }

      if (data.status === 'error') {
        handlersRef.current.onError(data.error ?? 'El agente falló.')
        return
      }

      // pending: seguir mientras no expire el TTL.
      if (expired()) {
        handlersRef.current.onError('El agente tardó demasiado. Probá de nuevo.')
        return
      }
      timer = setTimeout(poll, POLL_INTERVAL_MS)
    }

    poll()

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [jobId])
}
