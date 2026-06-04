import { Skeleton } from '@/components/ui/skeleton'

export function KanbanSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Topbar slot placeholder */}
      <div className="h-9 w-full" />

      {/* Columns */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, col) => (
          <div key={col} className="flex min-w-[260px] flex-col gap-3">
            {/* Column header */}
            <Skeleton className="h-8 w-32" />
            {/* Cards */}
            {Array.from({ length: 3 }).map((_, card) => (
              <Skeleton key={card} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
