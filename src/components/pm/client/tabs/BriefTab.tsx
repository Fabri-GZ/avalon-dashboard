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
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Brief del proyecto
          </p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describí el alcance prometido al cliente: entregables, cantidades, plataformas, fechas clave..."
            className="w-full h-48 text-sm text-foreground bg-background border border-border rounded-md p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            {brief && (
              <button
                onClick={() => { setEditing(false); setContent(brief.content) }}
                className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!content.trim() || isPending}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Guardando...' : 'Guardar Brief'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Brief del proyecto
            </p>
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-primary font-medium hover:underline"
            >
              Editar
            </button>
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {brief?.content}
          </p>
          <p className="text-[10px] text-muted-foreground mt-5">
            Cargado el {formatDate(brief?.created_at ?? null)} · Texto manual
          </p>
        </div>
      )}
    </div>
  )
}
