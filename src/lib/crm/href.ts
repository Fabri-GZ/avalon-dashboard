const CRM_BASE = '/dashboard/chatbot/crm'

// Every CRM link carries the *server-resolved* `client_id`, never the raw
// `?client=` the browser happened to send. `resolveClientId` already validated
// it, and it is also defined when the URL had no param at all -- which is the
// case that used to break: an admin_global landing on `/crm` with no param
// resolves to "the client of the most recently active lead", so a link that
// dropped the param would re-resolve on the next request and could land on a
// different client than the one on screen. Threading the resolved id keeps a
// navigation inside the client the user is actually looking at.
//
// For every other role the param is meaningless (`resolveClientId` 404s on it),
// so it is only emitted when a client id is actually known.
export function crmHref(clientId?: string | null): string {
  return clientId ? `${CRM_BASE}?client=${encodeURIComponent(clientId)}` : CRM_BASE
}

export function crmLeadHref(sessionId: string, clientId?: string | null): string {
  const path = `${CRM_BASE}/${encodeURIComponent(sessionId)}`
  return clientId ? `${path}?client=${encodeURIComponent(clientId)}` : path
}
