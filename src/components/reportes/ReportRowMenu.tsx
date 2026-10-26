'use client'

import Link from 'next/link'
import { LuEllipsisVertical, LuExternalLink, LuPencil, LuSend } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { AccountRow } from '@/lib/reportes/types'
import { periodLabel } from '@/lib/reportes/format'

interface Props extends Pick<AccountRow, 'latestComplete' | 'latestDoneRender'> {
  accountId: string
  /** Without it the menu has no send item (sending is wired by the parent). */
  onSend?: (accountId: string) => void
  className?: string
}

/**
 * Kebab with the complete-report actions of one account. Each item exists only
 * when it can work: editing needs a draft, viewing and sending need a finished
 * render. The parent reserves the slot when this renders nothing.
 *
 * The labels name the period for the same reason `ViewButton` does: the row's
 * period column can show a different month while a new report generates.
 */
export function ReportRowMenu({
  latestComplete,
  latestDoneRender,
  accountId,
  onSend,
  className,
}: Props) {
  if (!latestComplete && !latestDoneRender) return null

  const doneReport = latestDoneRender?.report

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon-sm"
          variant="outline"
          className={className}
          aria-label="Más acciones del reporte completo"
          title="Más acciones"
        >
          <LuEllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {latestComplete && (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/reportes/${latestComplete.id}`}>
              <LuPencil /> Editar borrador
              <span className="text-xs text-muted-foreground">
                {periodLabel(latestComplete.period_year, latestComplete.period_month)} · v{latestComplete.version}
              </span>
            </Link>
          </DropdownMenuItem>
        )}
        {latestDoneRender && doneReport && (
          <>
            <DropdownMenuItem asChild>
              <a href={latestDoneRender.render.report_url!} target="_blank" rel="noopener noreferrer">
                <LuExternalLink /> Ver reporte final
                <span className="text-xs text-muted-foreground">
                  {periodLabel(doneReport.period_year, doneReport.period_month)} · v{doneReport.version}
                </span>
              </a>
            </DropdownMenuItem>
            {onSend && (
              <DropdownMenuItem onSelect={() => onSend(accountId)}>
                <LuSend /> Enviar al cliente
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
