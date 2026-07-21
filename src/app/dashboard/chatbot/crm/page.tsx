import { notFound } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/server'
import { getLeadsColumn, getStageCounts, parseColumnPages } from '@/lib/crm/queries'
import { resolveClientId } from '@/lib/crm/resolveClientId'
import { validateDateRange } from '@/lib/validateDateRange'
import { KanbanBoard } from '@/components/crm/KanbanBoard'
import { CrmClientSync } from '@/components/crm/CrmClientSync'
import type { CrmDateRange, Stage } from '@/lib/crm/types'

const VALID_CRM_RANGES = ['7d', '30d', '90d', 'todo'] as const
const STAGES: Stage[] = ['conversando', 'derivado', 'cerrado']

type Props = {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function CrmPage({ searchParams }: Props) {
  const params = await searchParams
  const dateRange = validateDateRange<CrmDateRange>(params.range, VALID_CRM_RANGES, '30d')
  const q = params.q?.trim() || undefined

  const requestedClientId = params.client?.trim() || undefined

  const supabase = await createClient()
  const clientId = await resolveClientId(supabase, requestedClientId)
  if (!clientId) notFound()

  // Each column carries its own page count, so "cargar más" on one column
  // leaves the other two untouched.
  const pagesByStage = Object.fromEntries(
    STAGES.map((stage) => [stage, parseColumnPages(params[`pages_${stage}`])]),
  ) as Record<Stage, number>

  const [columnResults, counts] = await Promise.all([
    Promise.all(
      STAGES.map((stage) =>
        getLeadsColumn(supabase, clientId, {
          stage,
          dateRange,
          q,
          pages: pagesByStage[stage],
        }),
      ),
    ),
    getStageCounts(supabase, clientId, 'whatsapp', q, dateRange),
  ])

  const columns = Object.fromEntries(
    STAGES.map((stage, i) => [stage, columnResults[i]]),
  ) as Record<Stage, (typeof columnResults)[number]>

  return (
    <>
      <CrmClientSync clientId={clientId} />
      <KanbanBoard
        columns={columns}
        counts={counts}
        initialDateRange={dateRange}
        initialQuery={q ?? ''}
      />
    </>
  )
}
