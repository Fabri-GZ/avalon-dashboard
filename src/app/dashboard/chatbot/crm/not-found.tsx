'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { LuSearchX as SearchX, LuArrowLeft as ArrowLeft } from 'react-icons/lu'

// Catches `notFound()` from both `crm/page.tsx` (client not resolvable for
// this session) and `crm/[sessionId]/page.tsx` (lead doesn't exist / doesn't
// belong to this client). The copy is deliberately generic: it must not say
// "this client isn't yours" or "this lead doesn't exist", because that
// distinction is exactly what the 404 in `resolveClientId.ts` is designed to
// hide from the person hitting it. See that file's comment for why.
//
// Client Component only because of the entrance animation -- a plain
// server-rendered version would be equally correct functionally.
export default function CrmNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-border bg-muted/30 p-8 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <SearchX className="h-6 w-6" />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold text-foreground">No pudimos encontrar esto</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            El contenido solicitado no está disponible o no existe.
          </p>
        </div>
        <Link
          href="/dashboard/chatbot/crm"
          className="mt-1 flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/70"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al CRM
        </Link>
      </motion.div>
    </div>
  )
}
