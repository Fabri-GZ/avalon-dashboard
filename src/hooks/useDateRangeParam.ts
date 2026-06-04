'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export function useDateRangeParam<T extends string>(
  validValues: readonly T[],
  defaultRange: T = '30d' as T,
): [T, (range: T) => void] {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const raw = searchParams.get('range') as T | null
  const current: T =
    raw && (validValues as readonly string[]).includes(raw) ? raw : defaultRange

  const setRange = (range: T) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', range)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return [current, setRange]
}
