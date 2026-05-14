import { createClient } from '@/app/utils/supabase/server'
import { getFeedData } from '@/lib/pm/feed-queries'
import { StatsPills } from './StatsPills'
import { FeedGroup } from './FeedGroup'

interface PendingFeedProps {
  /** PM's asana_project_gids. Pass `null` for admin_global (no scoping). */
  gids: string[] | null
}

export async function PendingFeed({ gids }: PendingFeedProps) {
  const supabase = await createClient()
  const feed = await getFeedData(supabase, { gids })

  const noWork =
    feed.groups.immediate.length === 0 &&
    feed.groups.thisWeek.length === 0 &&
    feed.groups.setup.length === 0

  return (
    <div>
      <StatsPills stats={feed.stats} />

      {noWork ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="text-sm font-semibold text-foreground">
            Todo al día
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            No hay tareas vencidas, vencimientos próximos ni setup pendiente.
          </p>
        </div>
      ) : (
        <>
          <FeedGroup title="Atención inmediata" items={feed.groups.immediate} />
          <FeedGroup title="Esta semana" items={feed.groups.thisWeek} />
          <FeedGroup title="Setup pendiente" items={feed.groups.setup} />
        </>
      )}
    </div>
  )
}
