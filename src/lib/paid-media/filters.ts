// URL-param filter contract for the Clientes screen (design D-C/D-D/D-E).
// One shared shape used by both directions: `page.tsx` reads it back with
// `parseFilters`, `ClientesTopbar`/`ClientesFilterSheet` write it with
// `buildHref`. `''` means "todos" for every dimension.

export interface ClientesFilters {
  q: string
  status: string
  platform: string
  operator: string
}

const EMPTY: ClientesFilters = { q: '', status: '', platform: '', operator: '' }

// Search terms are capped before they ever reach a query — belt-and-braces
// alongside the whitelist validation `page.tsx` applies to `status`/
// `platform` (Threat Matrix: untrusted URL params reaching a query
// builder).
const MAX_SEARCH_LENGTH = 100

// NFD strip + lowercase — the JS mirror of the DB's `pm_unaccent()` (D-E),
// so typing "garzon" matches a `search_text` column built the same way.
// Relocated from `ClientesView.tsx`'s local `norm()`.
export function normalizeSearch(q: string): string {
  return q
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .slice(0, MAX_SEARCH_LENGTH)
}

type SearchParamsLike = { [key: string]: string | string[] | undefined }

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? ''
}

// Reads the Next.js `searchParams` shape (works for both the awaited
// server-component prop and a plain `URLSearchParams`-derived object).
export function parseFilters(searchParams: SearchParamsLike | URLSearchParams): ClientesFilters {
  if (searchParams instanceof URLSearchParams) {
    return {
      q: normalizeSearch(searchParams.get('q') ?? ''),
      status: searchParams.get('status')?.trim() ?? '',
      platform: searchParams.get('platform')?.trim() ?? '',
      operator: searchParams.get('operator')?.trim() ?? '',
    }
  }

  return {
    q: normalizeSearch(first(searchParams.q)),
    status: first(searchParams.status),
    platform: first(searchParams.platform),
    operator: first(searchParams.operator),
  }
}

export function areFiltersEqual(a: ClientesFilters, b: ClientesFilters): boolean {
  return a.q === b.q && a.status === b.status && a.platform === b.platform && a.operator === b.operator
}

export function isEmptyFilters(filters: ClientesFilters): boolean {
  return areFiltersEqual(filters, EMPTY)
}

// Builds the target href for `router.push`, omitting empty ("todos")
// dimensions entirely rather than writing `?status=&platform=`.
export function buildHref(pathname: string, draft: ClientesFilters): string {
  const params = new URLSearchParams()
  if (draft.q) params.set('q', draft.q)
  if (draft.status) params.set('status', draft.status)
  if (draft.platform) params.set('platform', draft.platform)
  if (draft.operator) params.set('operator', draft.operator)

  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}
