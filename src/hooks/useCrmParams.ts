'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { Stage } from '@/lib/crm/types'
import { parseColumnPages } from '@/lib/crm/queries'

// One param per kanban column (design D5: pagination is per-column, not
// global) -- `pages_conversando`, `pages_derivado`, `pages_cerrado`. Prefixed
// rather than nested so it coexists with `useDateRangeParam`'s `range` and
// PR5's future `?client=` on the same URLSearchParams without colliding.
//
// The value is a page count, not a cursor: a column only ever shows a prefix
// of the ordering, so the count is the whole state, it survives a reload for
// free, and the server rebuilds the window in a single query.
const PAGES_PARAM_PREFIX = 'pages_'
const QUERY_PARAM = 'q'

// PR5 adds `?client=`, honored server-side only for `admin_global` (see
// `resolveClientId.ts`). Not read or written here yet -- this is the extension
// point: a `client` field would follow the same get/set pattern as `q`.

export interface CrmParams {
  q: string
  setQuery: (next: string) => void
  getPages: (stage: Stage) => number
  loadMore: (stage: Stage) => void
}

export function useCrmParams(): CrmParams {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const q = searchParams.get(QUERY_PARAM) ?? ''

  const replace = (params: URLSearchParams) => {
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const clearPageParams = (params: URLSearchParams) => {
    for (const key of Array.from(params.keys())) {
      if (key.startsWith(PAGES_PARAM_PREFIX)) params.delete(key)
    }
  }

  const getPages = (stage: Stage): number =>
    parseColumnPages(searchParams.get(`${PAGES_PARAM_PREFIX}${stage}`) ?? undefined)

  const setQuery = (next: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next) params.set(QUERY_PARAM, next)
    else params.delete(QUERY_PARAM)
    // A new search term changes what "page 2" of a column even means, so every
    // column collapses back to its first page.
    clearPageParams(params)
    replace(params)
  }

  const loadMore = (stage: Stage) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(`${PAGES_PARAM_PREFIX}${stage}`, String(getPages(stage) + 1))
    replace(params)
  }

  return { q, setQuery, getPages, loadMore }
}
