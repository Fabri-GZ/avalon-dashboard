'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { LuCheck as Check, LuPlus as Plus, LuTriangleAlert as AlertTriangle } from 'react-icons/lu'

// D10: `client_name` dedup is human-confirmed, never automatic. Autocomplete
// over the values the page already loaded — no extra query at 22 rows.
// Selecting an existing name reuses it byte-for-byte. A near-match (same
// name once accents/case/spacing are ignored, but not identical) is
// SURFACED with a banner, never silently merged. Creating a new name is an
// explicit list item, distinguishable from picking an existing one.

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

// The only normalization applied on save: trim + collapse internal
// whitespace. Never case-folding, never accent-stripping — those stay
// visible to the human via the near-match banner instead.
const normalizeForSave = (s: string) => s.trim().replace(/\s+/g, ' ')

interface Props {
  value: string
  onChange: (name: string) => void
  existingNames: string[]
  id?: string
}

export function ClientNameCombobox({ value, onChange, existingNames, id }: Props) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Sync local `query` when the controlling `value` prop changes (e.g. the
  // form resets between "editar cuenta" targets), without the cascading
  // re-render an effect-based sync would cause — this is React's documented
  // "adjust state during render" pattern, not a plain effect.
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    setQuery(value)
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const sortedNames = useMemo(
    () => Array.from(new Set(existingNames.filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [existingNames],
  )

  const q = norm(query)
  const suggestions = useMemo(
    () => (q ? sortedNames.filter((n) => norm(n).includes(q)) : sortedNames).slice(0, 8),
    [sortedNames, q],
  )

  const normalizedTyped = normalizeForSave(query)
  const exactExisting = sortedNames.find((n) => n === normalizedTyped)
  const nearMatch =
    !exactExisting && normalizedTyped
      ? sortedNames.find((n) => norm(n) === norm(normalizedTyped))
      : undefined
  const canCreate = normalizedTyped.length > 0 && !exactExisting && !nearMatch

  function selectExisting(name: string) {
    setQuery(name)
    onChange(name)
    setOpen(false)
  }

  function createNew() {
    if (!canCreate) return
    setQuery(normalizedTyped)
    onChange(normalizedTyped)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Nombre del cliente"
        autoComplete="off"
        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15"
      />

      {nearMatch && (
        <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Existe «{nearMatch}» — ¿es el mismo cliente?{' '}
            <button
              type="button"
              onClick={() => selectExisting(nearMatch)}
              className="font-semibold underline underline-offset-2"
            >
              Usar «{nearMatch}»
            </button>
          </span>
        </p>
      )}

      {open && (suggestions.length > 0 || canCreate) && (
        <div className="absolute z-[70] mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-card p-1.5 shadow-lg">
          {suggestions.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => selectExisting(name)}
              className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-secondary ${
                name === value ? 'bg-primary/5 font-medium' : ''
              }`}
            >
              {name}
              {name === value && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
            </button>
          ))}

          {canCreate && (
            <button
              type="button"
              onClick={createNew}
              className="mt-0.5 flex w-full items-center gap-2 rounded-md border-t border-border px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary/5"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              Crear cliente «{normalizedTyped}»
            </button>
          )}
        </div>
      )}
    </div>
  )
}
