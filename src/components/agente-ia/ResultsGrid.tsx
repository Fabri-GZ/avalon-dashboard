import type { IconType } from 'react-icons'
import { LuHeart, LuMessageCircle, LuShare2, LuPlay, LuTrendingUp } from 'react-icons/lu'
import type { TrendPost, TrendResponse } from '@/lib/agente-ia/types'
import { MetaBadge } from './MetaBadge'

interface ResultsGridProps {
  results: TrendResponse['results']
  meta: TrendResponse['meta']
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function Metric({ icon: Icon, value }: { icon: IconType; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
    </span>
  )
}

function PlatformChip({ platform }: { platform: 'instagram' | 'tiktok' }) {
  const styles = {
    instagram: 'bg-pink-500/10 text-pink-600 dark:text-pink-300',
    tiktok: 'bg-foreground/[0.06] text-foreground/70',
  }
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles[platform]}`}>
      {platform === 'instagram' ? 'Instagram' : 'TikTok'}
    </span>
  )
}

function PostCard({ post, platform }: { post: TrendPost; platform: 'instagram' | 'tiktok' }) {
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col gap-3 rounded-xl border border-border/70 bg-card p-3.5 transition-all hover:border-primary/40 hover:shadow-[0_8px_24px_-14px_rgba(20,20,40,0.25)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{post.account}</p>
          {post.format && <p className="text-xs text-muted-foreground">{post.format}</p>}
        </div>
        <PlatformChip platform={platform} />
      </div>

      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs">
        <Metric icon={LuHeart} value={formatNumber(post.likes)} />
        <Metric icon={LuMessageCircle} value={formatNumber(post.comments)} />
        <Metric icon={LuShare2} value={formatNumber(post.shares)} />
        {post.plays !== undefined && <Metric icon={LuPlay} value={formatNumber(post.plays)} />}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-2.5">
        <span
          title="Velocidad de engagement (interacciones por día)"
          className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary"
        >
          <LuTrendingUp className="h-3 w-3" />
          {formatNumber(post.score)}
        </span>
        <span className="text-[11px] text-muted-foreground">hace {post.ageDays}d</span>
      </div>
    </a>
  )
}

function Section({
  title,
  posts,
  platform,
}: {
  title: string
  posts: TrendPost[]
  platform: 'instagram' | 'tiktok'
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground/60">{posts.length}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, i) => (
          <PostCard key={i} post={post} platform={platform} />
        ))}
      </div>
    </div>
  )
}

export function ResultsGrid({ results, meta }: ResultsGridProps) {
  const hasResults = results.instagram.length > 0 || results.tiktok.length > 0
  if (!hasResults) return null

  // Opción B — panel de resultados contenedor, alineado bajo el avatar del agente.
  return (
    <div className="ml-[42px] overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-sm">
      <div className="border-b border-border/60 bg-card px-4 py-3">
        <MetaBadge meta={meta} />
      </div>
      <div className="flex flex-col gap-5 p-4">
        {results.instagram.length > 0 && (
          <Section title="Instagram" posts={results.instagram} platform="instagram" />
        )}
        {results.tiktok.length > 0 && (
          <Section title="TikTok" posts={results.tiktok} platform="tiktok" />
        )}
      </div>
    </div>
  )
}
