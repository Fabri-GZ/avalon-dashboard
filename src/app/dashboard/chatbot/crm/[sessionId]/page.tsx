import { notFound } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/server'
import { getLeadWithMessages } from '@/lib/crm/queries'
import { resolveClientId } from '@/lib/crm/resolveClientId'
import { ConversationView } from '@/components/crm/ConversationView'

type Props = {
  params: Promise<{ sessionId: string }>
}

export default async function CrmConversationPage({ params }: Props) {
  const { sessionId } = await params
  const supabase = await createClient()
  const clientId = await resolveClientId(supabase)
  if (!clientId) notFound()

  const result = await getLeadWithMessages(supabase, clientId, sessionId)

  if (!result) notFound()

  return <ConversationView lead={result.lead} messages={result.messages} />
}
