/**
 * Normalizes a user-typed website into an absolute http(s) URL.
 *
 * - Blank input yields `null` (valid: the field is optional).
 * - A missing scheme gets `https://` (`www.foo.com` -> `https://www.foo.com`).
 * - Any explicit scheme other than http/https (`javascript:`, `data:`, ...) is
 *   rejected, as is anything `new URL()` cannot parse.
 *
 * Returns `undefined` when the value is invalid so callers can tell it apart
 * from the valid blank (`null`).
 */
export function normalizeWebsiteUrl(raw: string | null): string | null | undefined {
  const value = raw?.trim()
  if (!value) return null

  // `host:port` also matches `scheme:`; only treat `://` or the known
  // script-capable schemes as an explicit scheme, everything else gets https.
  const hasScheme = /^[a-z][a-z0-9+.-]*:(\/\/|[^0-9])/i.test(value)
  const candidate = hasScheme ? value : `https://${value}`

  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    return candidate
  } catch {
    return undefined
  }
}

/** True only when the stored value parses as an http(s) URL (safe for `href`). */
export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}
