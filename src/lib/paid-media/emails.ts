// Report recipients (main email + CC list) of a paid-media client.
// Shared by the form (instant feedback) and the server actions (authority), so
// both normalize identically. Mirrors the DB `public.is_valid_email` regex.

export const MAX_CC_EMAILS = 10

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export const normalizeEmail = (raw: string): string => raw.trim().toLowerCase()

export const isValidEmail = (email: string): boolean => EMAIL_RE.test(email)

/** Splits free text on commas, semicolons, whitespace and newlines. */
export function splitEmailList(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map(normalizeEmail)
    .filter(Boolean)
}

export interface AddEmailsResult {
  /** The list with every valid, new address appended (up to `MAX_CC_EMAILS`). */
  list: string[]
  /** Malformed addresses, not added. */
  invalid: string[]
  /** Addresses already in the list (case-insensitive), not added. */
  duplicates: string[]
  /** Valid addresses left out because the list hit `MAX_CC_EMAILS`. */
  overflow: string[]
}

/** Adds the addresses typed or pasted in `raw` to a CC list, one at a time. */
export function addEmails(list: string[], raw: string): AddEmailsResult {
  const next = [...list]
  const seen = new Set(list.map(normalizeEmail))
  const result: AddEmailsResult = { list: next, invalid: [], duplicates: [], overflow: [] }
  for (const email of splitEmailList(raw)) {
    if (!isValidEmail(email)) result.invalid.push(email)
    else if (seen.has(email)) result.duplicates.push(email)
    else if (next.length >= MAX_CC_EMAILS) result.overflow.push(email)
    else {
      next.push(email)
      seen.add(email)
    }
  }
  return result
}

// Flat shape on purpose: the repo runs without strictNullChecks, where a
// `{ ok: true } | { ok: false }` union does not narrow.
export interface RecipientsResult {
  ok: boolean
  email: string
  cc: string[]
  field?: 'report_email' | 'report_cc_emails'
  invalid?: string[]
}

/**
 * Validates and normalizes the recipients. The main email is required. CC is
 * deduped and the main email is dropped from it (it already receives the mail,
 * so a duplicate is redundant, not an error). More than `MAX_CC_EMAILS` or any
 * malformed address is rejected.
 */
export function normalizeRecipients(mainRaw: string, ccRaw: string[]): RecipientsResult {
  const email = normalizeEmail(mainRaw)
  if (!isValidEmail(email)) return { ok: false, email, cc: [], field: 'report_email' }

  const invalid = ccRaw.map(normalizeEmail).filter((e) => e && !isValidEmail(e))
  if (invalid.length > 0) return { ok: false, email, cc: [], field: 'report_cc_emails', invalid }

  const cc = [...new Set(ccRaw.map(normalizeEmail).filter(Boolean))].filter((e) => e !== email)
  if (cc.length > MAX_CC_EMAILS) return { ok: false, email, cc: [], field: 'report_cc_emails' }

  return { ok: true, email, cc }
}
