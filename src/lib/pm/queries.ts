import type { Client, Brief, SectionWithTasks, Report } from './types'
import { createClient as createServerClient } from '@/app/utils/supabase/server'
import { createClient as createBrowserClient } from '@/app/utils/supabase/client'
import { supabaseAdmin } from '@/app/utils/supabase/admin'

type ServerClient = Awaited<ReturnType<typeof createServerClient>>
type BrowserClient = ReturnType<typeof createBrowserClient>
type AdminClient = typeof supabaseAdmin
type PmQueryClient = ServerClient | BrowserClient | AdminClient

export async function getClientsWithStatus(
  supabase: ServerClient,
  gids: string[]
): Promise<Client[]> {
  if (!gids.length) return []

  const { data: clients, error } = await supabase
    .from('pm_clients')
    .select('*')
    .in('asana_project_id', gids)
    .order('name')

  if (error) throw new Error(error.message)
  return clients as Client[]
}

export async function getClientById(
  supabase: PmQueryClient,
  id: string
): Promise<Client | null> {
  const { data, error } = await supabase
    .from('pm_clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Client
}

export async function getSectionsWithTasks(
  supabase: PmQueryClient,
  clientId: string
): Promise<SectionWithTasks[]> {
  const { data: sections, error: secErr } = await supabase
    .from('pm_sections')
    .select('*')
    .eq('client_id', clientId)
    .order('order', { ascending: true, nullsFirst: false })

  if (secErr) throw new Error(secErr.message)

  const { data: tasks, error: taskErr } = await supabase
    .from('pm_tasks')
    .select('*')
    .eq('client_id', clientId)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (taskErr) throw new Error(taskErr.message)

  return (sections ?? []).map((section) => ({
    ...section,
    tasks: (tasks ?? []).filter((t) => t.section_id === section.id),
  }))
}

export async function getLatestBrief(
  supabase: PmQueryClient,
  clientId: string
): Promise<Brief | null> {
  const { data, error } = await supabase
    .from('pm_briefs')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return null
  return data as Brief | null
}

export async function getLatestReport(
  supabase: PmQueryClient,
  clientId: string
): Promise<Report | null> {
  const { data, error } = await supabase
    .from('pm_reports')
    .select('*')
    .eq('client_id', clientId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return null
  return data as Report | null
}

export async function upsertBrief(
  supabase: BrowserClient,
  clientId: string,
  content: string
): Promise<Brief> {
  const { data, error } = await supabase
    .from('pm_briefs')
    .insert({ client_id: clientId, content, source: 'text' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Brief
}
