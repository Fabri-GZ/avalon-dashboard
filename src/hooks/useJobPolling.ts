'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import type { TrendResponse } from '@/lib/agente-ia/types'

const POLL_INTERVAL_MS = 3_000
// El workflow CM tarda ~100s; el peor caso real observado fue ~107s. 140s da
// colchón para hashtags nicho lentos sin colgar al CM indefinidamente.
const TTL_MS = 140_000

/**
 * Por qué el fallo viene clasificado y no como un solo `onError`:
 *
 * - `job`     — el worker escribió `status: 'error'` en la fila. Es un final:
 *               la fila de la DB ya dice `error` y el job no sigue corriendo.
 * - `timeout` — se venció el TTL, o las lecturas fallaron hasta agotarlo. NO
 *               es un final: la fila sigue en `pending`/`running` y el worker
 *               puede terminar perfectamente después de que dejamos de mirar.
 *
 * Sin esta distinción el llamador no puede hacer otra cosa que tratar a los
 * dos igual, y estampar `error` local sobre una fila que en la DB sigue
 * `pending` deja a la tabla mintiendo hasta el próximo refresh.
 */
export type JobPollFailure = 'job' | 'timeout'

export interface JobPollHandlers<T> {
  onDone: (result: T) => void
  onError: (message: string, reason: JobPollFailure) => void
}

/**
 * Config opcional para reusar el hook con otras tablas de jobs (ej. `reports`).
 * Los defaults reproducen EXACTAMENTE el comportamiento del CM sobre `agent_jobs`,
 * así que el call-site del CM no cambia.
 */
export interface JobPollConfig<T> {
  table?: string // default 'agent_jobs'
  select?: string // default 'status, result, error'
  getDone?: (row: Record<string, unknown>) => T // cómo extraer el payload de done
  getError?: (row: Record<string, unknown>) => string | null
  pollIntervalMs?: number
  ttlMs?: number
}

/**
 * Pollea una tabla de jobs por id vía el browser client (RLS) cada 3s y llama
 * `onDone`/`onError` cuando el job resuelve (o al vencer el TTL, si el worker
 * cayó sin escribir). Pasá `jobId` null para no pollear.
 *
 * Default: `agent_jobs` (CM). Para `reports` u otra tabla, pasá `config`.
 *
 * Los handlers se leen por ref, así que cambiar su identidad entre renders no
 * reinicia el polling: el effect depende solo de `jobId`.
 */
export function useJobPolling<T = TrendResponse>(
  jobId: string | null,
  handlers: JobPollHandlers<T>,
  config?: JobPollConfig<T>,
) {
  const handlersRef = useRef(handlers)
  useEffect(() => {
    handlersRef.current = handlers
  })

  // El config también se lee por ref: cambiar su identidad no reinicia el poll.
  const configRef = useRef(config)
  useEffect(() => {
    configRef.current = config
  })

  useEffect(() => {
    if (!jobId) return

    const cfg = configRef.current
    const table = cfg?.table ?? 'agent_jobs'
    const select = cfg?.select ?? 'status, result, error'
    const getDone = cfg?.getDone ?? ((row: Record<string, unknown>) => row.result as T)
    const getError =
      cfg?.getError ?? ((row: Record<string, unknown>) => (row.error as string | null) ?? null)
    const pollInterval = cfg?.pollIntervalMs ?? POLL_INTERVAL_MS
    const ttl = cfg?.ttlMs ?? TTL_MS

    const supabase = createClient()
    const startedAt = Date.now()
    let active = true
    let timer: ReturnType<typeof setTimeout>

    const expired = () => Date.now() - startedAt > ttl

    async function poll() {
      if (!active) return

      const { data, error } = await supabase
        .from(table)
        .select(select)
        .eq('id', jobId)
        .single()

      if (!active) return

      // Error de lectura (red/transitorio): reintenta hasta agotar el TTL.
      if (error || !data) {
        if (expired()) {
          // `timeout`, no `job`: nunca llegamos a leer la fila, así que no
          // sabemos en qué estado quedó. Lo único cierto es que dejamos de
          // mirar.
          handlersRef.current.onError('No se pudo leer el estado del job.', 'timeout')
          return
        }
        timer = setTimeout(poll, pollInterval)
        return
      }

      const row = data as unknown as Record<string, unknown>

      if (row.status === 'done') {
        handlersRef.current.onDone(getDone(row))
        return
      }

      if (row.status === 'error') {
        handlersRef.current.onError(getError(row) ?? 'El job falló.', 'job')
        return
      }

      // pending/running: seguir mientras no expire el TTL.
      if (expired()) {
        // La fila queda como está: `pending`/`running` es su estado real en la
        // DB en este instante. Dejamos de pollear, no damos el job por muerto.
        handlersRef.current.onError('El job tardó demasiado. Probá de nuevo.', 'timeout')
        return
      }
      timer = setTimeout(poll, pollInterval)
    }

    poll()

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [jobId])
}
