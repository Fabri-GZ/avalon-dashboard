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

  const [result, clientRes] = await Promise.all([
    getLeadWithMessages(supabase, clientId, sessionId),
    supabase.from('clients').select('webhook_derivar_url').eq('id', clientId).maybeSingle(),
  ])

  if (!result) notFound()

  const hasWebhook = !!(clientRes.data?.webhook_derivar_url)

  return <ConversationView lead={result.lead} messages={result.messages} hasWebhook={hasWebhook} />
}
