export function validateDateRange<T extends string>(
  raw: string | undefined | null,
  validValues: readonly T[],
  fallback: T,
): T {
  if (raw && (validValues as readonly string[]).includes(raw)) return raw as T
  return fallback
}
