import type { InsightsFetcher } from './types'
import { grupoNorteFetcher } from './grupo-norte/fetcher'

export const GRUPO_NORTE_CLIENT_ID = 'b7859a5a-d306-488a-ba3d-6733ae8430ad'

const fetchers: Record<string, InsightsFetcher> = {
  [GRUPO_NORTE_CLIENT_ID]: grupoNorteFetcher,
}

export function getInsightsFetcher(clientId: string): InsightsFetcher | null {
  return fetchers[clientId] ?? null
}
