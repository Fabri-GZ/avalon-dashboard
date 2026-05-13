'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import { upsertBrief } from '@/lib/pm/queries'
import { formatDate } from '@/lib/pm/utils'
import type { Brief } from '@/lib/pm/types'

export function BriefTab({ clientId, brief }: { clientId: string; brief: Brief | null }) {
  const [editing, setEditing] = useState(!brief)
  const [content, setContent] = useState(brief?.content ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSave() {
    if (!content.trim()) return
    setError(null)
    const supabase = createClient()
    try {
      await upsertBrief(supabase, clientId, content.trim())
      startTransition(() => {
        router.refresh()
        setEditing(false)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  return (
    <div className="w-full">
      {editing ? (
        <div className="bg-white rounded-card shadow-card p-6 space-y-4">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-poppins">
            Brief del proyecto
          </p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describí el alcance prometido al cliente: entregables, cantidades, plataformas, fechas clave..."
            className="w-full h-48 text-sm font-poppins text-text bg-bg border border-border rounded-item p-4 resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-text-muted"
          />
          {error && <p className="text-xs text-red-500 font-poppins">{error}</p>}
          <div className="flex gap-2 justify-end">
            {brief && (
              <button
                onClick={() => { setEditing(false); setContent(brief.content) }}
                className="px-4 py-2 text-xs font-poppins font-medium text-text-secondary hover:text-text transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!content.trim() || isPending}
              className="px-4 py-2 rounded-lg bg-brand text-white text-xs font-poppins font-semibold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Guardando...' : 'Guardar Brief'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-card shadow-card p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-poppins">
              Brief del proyecto
            </p>
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-brand font-poppins font-medium hover:underline"
            >
              Editar
            </button>
          </div>
          <p className="text-sm font-poppins text-text leading-relaxed whitespace-pre-wrap">
            {brief?.content}
          </p>
          <p className="text-[10px] text-text-muted font-poppins mt-5">
            Cargado el {formatDate(brief?.created_at ?? null)} · Texto manual
          </p>
        </div>
      )}
    </div>
  )
}
