'use client'

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
        className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-border bg-muted/30 p-12 text-center"
      >
        <div className="flex size-20 items-center justify-center rounded-full bg-primary/15 text-primary">
          <SearchX className="size-10" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xl font-semibold text-foreground">No pudimos encontrar esto</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            El contenido solicitado no está disponible o no existe.
          </p>
        </div>
        {/* A plain anchor, not next/link, on purpose. This boundary and the
         * CRM board share a pathname -- only the search params differ -- so a
         * client-side navigation lands on the same router entry and leaves the
         * rendered not-found state in place: the URL updates and the 404
         * stays. A hard navigation rebuilds the segment from scratch. The full
         * reload costs nothing on a dead-end screen. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the
         * full reload is the point here; see the comment above. */}
        <a
          href="/dashboard/chatbot/crm"
          className="mt-1 flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/70"
        >
          <ArrowLeft className="size-4" />
          Volver al CRM
        </a>
      </motion.div>
    </div>
  )
}
