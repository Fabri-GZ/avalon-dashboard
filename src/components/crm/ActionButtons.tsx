'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { GitBranch, MessageCircle, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { deriveLeadAction } from '@/app/actions/crm-actions'
import type { Stage } from '@/lib/crm/types'

export function ActionButtons({
  sessionId,
  stage,
  phone,
}: {
  sessionId: string
  stage: Stage
  phone: string | null
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const disabled = stage === 'derivado' || stage === 'cerrado'
  const waPhone = phone?.replace(/\D/g, '') ?? sessionId

  function handleDerive() {
    startTransition(async () => {
      const result = await deriveLeadAction(sessionId)
      if (!result.success) {
        if (result.error === 'window_closed') {
          toast.error('La ventana de 24 hs está cerrada. El lead no puede recibir mensajes.')
        } else {
          toast.error('Error al derivar. Intentá de nuevo.')
        }
        return
      }
      toast.success('Lead derivado correctamente.')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleDerive}
        disabled={disabled || pending}
        className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
          disabled
            ? 'cursor-not-allowed bg-muted text-muted-foreground'
            : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]'
        }`}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GitBranch className="h-4 w-4" />
        )}
        {pending ? 'Derivando…' : disabled ? 'Ya derivado' : 'Derivar automáticamente'}
      </button>

      <a
        href={`https://wa.me/${waPhone}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
      >
        <MessageCircle className="h-4 w-4 text-emerald-500" />
        Abrir WhatsApp
      </a>
    </div>
  )
}
