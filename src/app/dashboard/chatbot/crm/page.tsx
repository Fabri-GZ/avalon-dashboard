import { createClient } from '@/app/utils/supabase/server'
import { getLeads } from '@/lib/crm/queries'
import { KanbanBoard } from '@/components/crm/KanbanBoard'

export default async function CrmPage() {
  const supabase = await createClient()
  const leads = await getLeads(supabase)

  return <KanbanBoard leads={leads} />
}
