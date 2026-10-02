// PM / operator name normalization. Legacy data mixes "CARO", "gus" and "Caro";
// the team's style is first letter uppercase, rest lowercase, per word.

const LOCALE = 'es-AR'

/** "CARO" -> "Caro", "juan  perez" -> "Juan Perez". Blank/nullish -> null. */
export function normalizePersonName(value: string | null | undefined): string | null {
  const collapsed = value?.trim().replace(/\s+/g, ' ')
  if (!collapsed) return null
  return collapsed
    .split(' ')
    .map((word) => word.charAt(0).toLocaleUpperCase(LOCALE) + word.slice(1).toLocaleLowerCase(LOCALE))
    .join(' ')
}

/** Normalized, deduplicated (case-insensitive by construction) and sorted. */
export function distinctPersonNames(values: (string | null | undefined)[]): string[] {
  const distinct = new Set<string>()
  for (const v of values) {
    const name = normalizePersonName(v)
    if (name) distinct.add(name)
  }
  return Array.from(distinct).sort((a, b) => a.localeCompare(b, LOCALE))
}
