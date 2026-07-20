import { notFound } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/server'
import { getLeadsPage } from '@/lib/crm/queries'
import { resolveClientId } from '@/lib/crm/resolveClientId'
import { validateDateRange } from '@/lib/validateDateRange'
import { KanbanBoard } from '@/components/crm/KanbanBoard'
import type { CrmDateRange } from '@/lib/crm/types'

const VALID_CRM_RANGES = ['7d', '30d', '90d', 'todo'] as const

type Props = {
  searchParams: Promise<{ range?: string }>
}

export default async function CrmPage({ searchParams }: Props) {
  const { range } = await searchParams
  const dateRange = validateDateRange<CrmDateRange>(range, VALID_CRM_RANGES, '30d')

  const supabase = await createClient()
  const clientId = await resolveClientId(supabase)
  if (!clientId) notFound()

  const leads = await getLeadsPage(supabase, clientId, { dateRange })

  return <KanbanBoard leads={leads} initialDateRange={dateRange} />
}
