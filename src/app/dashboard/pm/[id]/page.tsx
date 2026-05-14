import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/app/utils/supabase/server'
import {
  getClientById,
  getLatestBrief,
  getSectionsWithTasks,
  getLatestReport,
} from '@/lib/pm/queries'
import { ClientHeader } from '@/components/pm/client/ClientHeader'
import { ClientTabs } from '@/components/pm/client/ClientTabs'
import { TasksTab } from '@/components/pm/client/tabs/TasksTab'
import { BriefTab } from '@/components/pm/client/tabs/BriefTab'
import { ReportTab } from '@/components/pm/client/tabs/ReportTab'
import { ClientSync } from '@/components/pm/ClientSync'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function PMClientPage({ params, searchParams }: Props) {
  const { id } = await params
  const { tab } = await searchParams
  const supabase = await createClient()
  const [client, latestBrief] = await Promise.all([
    getClientById(supabase, id),
    getLatestBrief(supabase, id),
  ])

  if (!client) notFound()

  const activeTab = tab ?? 'tareas'

  let tabContent: React.ReactNode

  if (activeTab === 'tareas') {
    const sections = await getSectionsWithTasks(supabase, id)
    tabContent = <TasksTab sections={sections} />
  } else if (activeTab === 'brief') {
    tabContent = <BriefTab clientId={id} brief={latestBrief} />
  } else {
    const report = await getLatestReport(supabase, id)
    tabContent = <ReportTab report={report} />
  }

  return (
    <div className="flex flex-col h-full">
      <ClientSync clientId={id} />
      <ClientHeader client={client} latestBrief={latestBrief} />
      <Suspense>
        <ClientTabs clientId={id} />
      </Suspense>
      <div key={activeTab} className="flex-1 p-7 tab-content-enter">
        {tabContent}
      </div>
    </div>
  )
}
