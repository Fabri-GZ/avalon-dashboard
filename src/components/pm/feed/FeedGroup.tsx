import { FeedRow } from './FeedRow'
import type { FeedItem } from '@/lib/pm/types'

interface FeedGroupProps {
  title: string
  items: FeedItem[]
}

export function FeedGroup({ title, items }: FeedGroupProps) {
  if (items.length === 0) return null

  return (
    <section className="mb-7">
      <h3 className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {title}
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          {items.length}
        </span>
      </h3>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <FeedRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
