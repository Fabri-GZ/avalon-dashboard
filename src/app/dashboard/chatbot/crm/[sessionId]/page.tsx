import { notFound } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/server'
import { getLeadWithMessages } from '@/lib/crm/queries'
import { resolveClientId } from '@/lib/crm/resolveClientId'
import { crmHref } from '@/lib/crm/href'
import { ConversationView } from '@/components/crm/ConversationView'

type Props = {
  params: Promise<{ sessionId: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function CrmConversationPage({ params, searchParams }: Props) {
  const { sessionId } = await params
  // Read exactly like the board does. Without it an admin_global opening a lead
  // fell through to "the client of the most recently active lead", which is not
  // necessarily the client the lead belongs to -- so the page 404'd, and the
  // "Volver al CRM" link landed on whichever client happened to be most active.
  const requestedClientId = (await searchParams).client?.trim() || undefined

  const supabase = await createClient()
  const clientId = await resolveClientId(supabase, requestedClientId)
  if (!clientId) notFound()

  const [result, clientRes] = await Promise.all([
    getLeadWithMessages(supabase, clientId, sessionId),
    supabase.from('clients').select('webhook_derivar_url').eq('id', clientId).maybeSingle(),
  ])

  if (!result) notFound()

  const hasWebhook = !!(clientRes.data?.webhook_derivar_url)

  return (
    <ConversationView
      lead={result.lead}
      messages={result.messages}
      hasWebhook={hasWebhook}
      backHref={crmHref(clientId)}
    />
  )
}
