'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { LuCheck as Check, LuPlus as Plus, LuTriangleAlert as AlertTriangle } from 'react-icons/lu'

// Combobox de texto libre con autocompletado sobre los valores que la página
// ya cargó — sin query extra. Generalizado desde `ClientNameCombobox` (D10)
// para que PM y Operador usen exactamente la misma interacción que Cliente:
// escribir "G" ofrece "Gus", y un valor que no está en la lista se puede
// crear igual, porque van a aparecer PMs/operadores nuevos.
//
// La regla que da sentido al componente se mantiene intacta: la deduplicación
// es confirmada por una persona, nunca automática. Elegir un valor existente
// lo reutiliza byte a byte; una casi-coincidencia (mismo valor ignorando
// acentos/mayúsculas/espacios, pero no idéntico) se MUESTRA con un aviso, no
// se fusiona en silencio; y crear un valor nuevo es un ítem explícito de la
// lista, distinguible de elegir uno existente.

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

// La única normalización que se aplica al guardar: trim + colapso de espacios
// internos. Nunca case-folding ni quitar acentos — eso queda visible para la
// persona a través del aviso de casi-coincidencia.
const normalizeForSave = (s: string) => s.trim().replace(/\s+/g, ' ')

interface Props {
  value: string
  onChange: (name: string) => void
  /** Valores ya existentes, para autocompletar. */
  options: string[]
  placeholder: string
  /** Sustantivo del ítem "crear": «Crear {createLabel} «X»». */
  createLabel: string
  /** Pregunta del aviso de casi-coincidencia. */
  nearMatchQuestion: string
  id?: string
}

export function NameCombobox({
  value,
  onChange,
  options,
  placeholder,
  createLabel,
  nearMatchQuestion,
  id,
}: Props) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  // -1 = nada resaltado: el input se comporta como un campo de texto común y
  // Enter hace lo que siempre hizo (enviar el formulario). Solo cuando hay
  // algo resaltado el combobox se queda con las teclas.
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = `${id ?? 'combobox'}-listbox`

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
    () => Array.from(new Set(options.filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [options],
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

  // Lista navegable = sugerencias + (si aplica) el ítem de crear al final,
  // en el mismo orden en que se pintan. Un solo índice recorre las dos cosas.
  const navigableCount = suggestions.length + (canCreate ? 1 : 0)
  const listOpen = open && navigableCount > 0

  // El resaltado se descarta cuando cambia lo que hay debajo: si el usuario
  // sigue escribiendo, el ítem 2 de la lista anterior no es el ítem 2 de esta.
  const [prevSuggestionKey, setPrevSuggestionKey] = useState('')
  const suggestionKey = `${suggestions.join(' ')}|${canCreate}`
  if (suggestionKey !== prevSuggestionKey) {
    setPrevSuggestionKey(suggestionKey)
    setActiveIndex(-1)
  }

  // El ítem resaltado se mantiene a la vista: la lista scrollea a los 56 de
  // alto y con el teclado no hay puntero que arrastre el scroll.
  useEffect(() => {
    if (activeIndex < 0) return
    document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, listId])

  function selectExisting(name: string) {
    setQuery(name)
    onChange(name)
    setOpen(false)
    setActiveIndex(-1)
  }

  function createNew() {
    if (!canCreate) return
    setQuery(normalizedTyped)
    onChange(normalizedTyped)
    setOpen(false)
    setActiveIndex(-1)
  }

  function commitIndex(i: number) {
    if (i < suggestions.length) selectExisting(suggestions[i])
    else createNew()
  }

  /**
   * Solo se interceptan las teclas de navegación. Cualquier otra —letras,
   * números, borrar, pegar— cae al comportamiento normal del input, así que
   * escribir nunca deja de funcionar por tener la lista abierta.
   *
   * `preventDefault` en las flechas es lo que separa las dos intenciones:
   * sin él, la flecha además manda el cursor al principio o al final del
   * texto, y se ven las dos cosas moverse a la vez.
   */
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
      return
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!open) {
        setOpen(true)
        return
      }
      if (navigableCount === 0) return
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      // Arranca en el primero al bajar y en el último al subir; después da la
      // vuelta, que es lo que hacen los Select de Radix del mismo formulario.
      setActiveIndex((i) => (i === -1 ? (step === 1 ? 0 : navigableCount - 1) : (i + step + navigableCount) % navigableCount))
      return
    }

    if (e.key === 'Enter' && activeIndex >= 0) {
      // Sin esto, Enter envía el formulario en vez de elegir la opción.
      e.preventDefault()
      commitIndex(activeIndex)
    }
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
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={listOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15"
      />

      {nearMatch && (
        <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Existe "{nearMatch}", {nearMatchQuestion}{' '}
            <button
              type="button"
              onClick={() => selectExisting(nearMatch)}
              className="font-semibold underline underline-offset-2"
            >
              Usar "{nearMatch}"
            </button>
          </span>
        </p>
      )}

      {listOpen && (
        <div
          id={listId}
          role="listbox"
          className="absolute z-70 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-card p-1.5 shadow-lg"
        >
          {suggestions.map((name, i) => (
            <button
              key={name}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={name === value}
              type="button"
              onClick={() => selectExisting(name)}
              // El resaltado del teclado usa el mismo `bg-secondary` que el
              // hover del mouse, así que los dos modos de recorrer la lista se
              // ven igual y no hay que aprender dos lenguajes visuales.
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-secondary ${
                i === activeIndex ? 'bg-secondary' : ''
              } ${name === value ? 'font-medium' : ''}`}
            >
              {name}
              {name === value && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
            </button>
          ))}

          {canCreate && (
            <button
              id={`${listId}-${suggestions.length}`}
              role="option"
              aria-selected={false}
              type="button"
              onClick={createNew}
              onMouseEnter={() => setActiveIndex(suggestions.length)}
              className={`mt-0.5 flex w-full items-center gap-2 rounded-md border-t border-border px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary/5 ${
                suggestions.length === activeIndex ? 'bg-primary/5' : ''
              }`}
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              Crear {createLabel} «{normalizedTyped}»
            </button>
          )}
        </div>
      )}
    </div>
  )
}
