import type { AsanaPaginatedResponse, AsanaTask } from './types'

const BASE_URL = 'https://app.asana.com/api/1.0'

export async function fetchAsana<T>(
  token: string,
  path: string,
  params: Record<string, string> = {}
): Promise<T[]> {
  const results: T[] = []
  let offset: string | null = null

  do {
    const url = new URL(`${BASE_URL}${path}`)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    if (offset) url.searchParams.set('offset', offset)

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(`Asana API ${res.status} on ${path}: ${await res.text()}`)
    }

    const json: AsanaPaginatedResponse<T> = await res.json()
    results.push(...json.data)
    offset = json.next_page?.offset ?? null
  } while (offset)

  return results
}

export async function updateAsanaTask(
  token: string,
  gid: string,
  data: { completed: boolean }
): Promise<AsanaTask> {
  const res = await fetch(`${BASE_URL}/tasks/${gid}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data }),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Asana API error: ${res.status} on PUT /tasks/${gid}`)
  }

  const json: { data: AsanaTask } = await res.json()
  return json.data
}

export async function fetchAsanaProjectName(token: string, gid: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/projects/${gid}?opt_fields=name`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Asana API ${res.status} on GET /projects/${gid}`)
  const json: { data: { name: string } } = await res.json()
  return json.data.name
}
