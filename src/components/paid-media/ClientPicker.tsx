'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { LuCheck as Check, LuPlus as Plus } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { createClientAction, type ExistingClientInfo } from '@/app/actions/paid-media-actions'
import { normalizePersonName } from '@/lib/paid-media/names'
import type { ClientOption } from '@/lib/paid-media/types'
import { NameCombobox } from './NameCombobox'

// Select-by-id picker for the account form's "Cliente" field. Unlike the
// free-text combobox it replaces, it can only COMMIT a client id: typing narrows
// the list, but text that is not a chosen (or just-created) client is
// "uncommitted" and reported through `onUncommittedChange` so the form can refuse
// to save. That is what makes the original bug (a typed name silently saved as
// null) impossible: there is no path from raw text to the saved value.

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

const collapse = (s: string) => s.trim().replace(/\s+/g, ' ')

const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15'

const LABEL_CLASS = 'mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'

interface Props {
  /** Active clients. Ids are committed; names are display only. */
  clients: ClientOption[]
  value: string | null
  onChange: (id: string | null) => void
  /** True while there is typed text that is not a committed client. */
  onUncommittedChange: (uncommitted: boolean) => void
  /** Option lists for the inline create form (PM / operator reuse `NameCombobox`). */
  pmNames: string[]
  operators: string[]
  id?: string
}

export function createErrorMessage(error: string | undefined, existing: ExistingClientInfo | undefined) {
  if (error === 'duplicate_client') {
    if (existing?.deletedAt) {
      return (
        <>
          Ya existe {`"${existing.name}"`} pero está en la papelera. Restauralo desde la{' '}
          <Link href="/dashboard/paid-media/clientes/papelera" className="font-semibold underline underline-offset-2">
            papelera
          </Link>{' '}
          en vez de crearlo de nuevo.
        </>
      )
    }
    if (existing) return `Ya existe un cliente llamado "${existing.name}". Elegilo de la lista.`
    return 'Ya existe un cliente con ese nombre y no podés verlo. Pedile a un admin que lo revise.'
  }
  if (error === 'unauthorized') return 'No tenés permisos para crear clientes.'
  if (error === 'invalid_value') return 'El nombre del cliente no es válido.'
  return 'No se pudo crear el cliente. Probá de nuevo.'
}

export function ClientPicker({ clients, value, onChange, onUncommittedChange, pmNames, operators, id }: Props) {
  // Clients created inline: shown immediately; deduped against `clients` once
  // the page refresh brings them in through props.
  const [created, setCreated] = useState<ClientOption[]>([])
  const options = useMemo(() => {
    const known = new Set(clients.map((c) => c.id))
    return [...clients, ...created.filter((c) => !known.has(c.id))].sort((a, b) => a.name.localeCompare(b.name))
  }, [clients, created])

  const [query, setQuery] = useState(() => options.find((c) => c.id === value)?.name ?? '')
  const [open, setOpen] = useState(false)
  // -1 = nothing highlighted, so Enter keeps submitting the form like in a plain input.
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = `${id ?? 'client-picker'}-listbox`

  const [creating, setCreating] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createPm, setCreatePm] = useState('')
  const [createOperator, setCreateOperator] = useState('')
  const [createError, setCreateError] = useState<React.ReactNode>(null)
  const [pending, startTransition] = useTransition()

  // Resync the text when the controlling id changes from outside (form reset
  // between targets). Null is skipped: it is what typing itself produces.
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    const name = options.find((c) => c.id === value)?.name
    if (name !== undefined) setQuery(name)
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const uncommitted = query.trim() !== '' && value === null
  useEffect(() => {
    onUncommittedChange(uncommitted)
  }, [uncommitted, onUncommittedChange])

  const q = norm(query)
  const suggestions = useMemo(() => (q ? options.filter((c) => norm(c.name).includes(q)) : options), [options, q])
  const typed = collapse(query)
  const canCreate = typed.length > 0 && !options.some((c) => norm(c.name) === q)

  const navigableCount = suggestions.length + (canCreate ? 1 : 0)
  const listOpen = open && navigableCount > 0

  // Drop the highlight when the list underneath changes: item 2 of the previous
  // list is not item 2 of this one.
  const [prevKey, setPrevKey] = useState('')
  const suggestionKey = `${suggestions.map((c) => c.id).join(' ')}|${canCreate}`
  if (suggestionKey !== prevKey) {
    setPrevKey(suggestionKey)
    setActiveIndex(-1)
  }

  useEffect(() => {
    if (activeIndex < 0) return
    document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, listId])

  function select(option: ClientOption) {
    setQuery(option.name)
    onChange(option.id)
    setOpen(false)
    setActiveIndex(-1)
    setCreating(false)
    setCreateError(null)
  }

  function startCreate() {
    setCreateName(typed)
    setCreatePm('')
    setCreateOperator('')
    setCreateError(null)
    setCreating(true)
    setOpen(false)
    setActiveIndex(-1)
  }

  function commitIndex(i: number) {
    if (i < suggestions.length) select(suggestions[i])
    else startCreate()
  }

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
      setActiveIndex((i) => (i === -1 ? (step === 1 ? 0 : navigableCount - 1) : (i + step + navigableCount) % navigableCount))
      return
    }

    if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      commitIndex(activeIndex)
    }
  }

  function submitCreate() {
    const name = collapse(createName)
    if (!name) {
      setCreateError('Escribí el nombre del cliente.')
      return
    }
    setCreateError(null)

    startTransition(async () => {
      const result = await createClientAction({
        company_name: name,
        website_url: null,
        instagram_url: null,
        pm_name: normalizePersonName(createPm),
        operator_name: normalizePersonName(createOperator),
        status: null,
      })

      if (!result.success || !result.clientId) {
        setCreateError(createErrorMessage(result.error, result.existingClient))
        return
      }

      const option = { id: result.clientId, name }
      setCreated((prev) => [...prev, option])
      select(option)
    })
  }

  // The create form lives inside the account `<form>`, so a bare Enter in one
  // of its inputs would submit the account. Combobox Enters that pick an item
  // are already `defaultPrevented`; any other Enter creates the client instead.
  function onCreateKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Enter' || e.defaultPrevented || !(e.target instanceof HTMLInputElement)) return
    e.preventDefault()
    if (!pending) submitCreate()
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          // Editing the text drops the committed client right away: what is
          // on screen and what gets saved can never disagree.
          if (value !== null) onChange(null)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Buscar o crear cliente"
        autoComplete="off"
        role="combobox"
        aria-expanded={listOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        className={INPUT_CLASS}
      />

      {listOpen && (
        <div
          id={listId}
          role="listbox"
          className="absolute z-70 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-card p-1.5 shadow-lg"
        >
          {suggestions.map((c, i) => (
            <button
              key={c.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={c.id === value}
              type="button"
              onClick={() => select(c)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-secondary ${
                i === activeIndex ? 'bg-secondary' : ''
              } ${c.id === value ? 'font-medium' : ''}`}
            >
              {c.name}
              {c.id === value && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
            </button>
          ))}

          {canCreate && (
            <button
              id={`${listId}-${suggestions.length}`}
              role="option"
              aria-selected={false}
              type="button"
              onClick={startCreate}
              onMouseEnter={() => setActiveIndex(suggestions.length)}
              className={`mt-0.5 flex w-full items-center gap-2 rounded-md border-t border-border px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary/5 ${
                suggestions.length === activeIndex ? 'bg-primary/5' : ''
              }`}
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              Crear cliente {`"${typed}"`}
            </button>
          )}
        </div>
      )}

      {creating && (
        <div onKeyDown={onCreateKeyDown} className="mt-2 space-y-3 rounded-lg border border-border bg-secondary/30 p-3">
          <p className="text-xs font-semibold text-foreground">Nuevo cliente</p>
          <div>
            <label className={LABEL_CLASS}>Nombre</label>
            <input value={createName} onChange={(e) => setCreateName(e.target.value)} className={INPUT_CLASS} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>PM</label>
              <NameCombobox
                value={createPm}
                onChange={setCreatePm}
                options={pmNames}
                placeholder="Nombre del PM"
                createLabel="PM"
                nearMatchQuestion=" es la misma persona?"
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Operador</label>
              <NameCombobox
                value={createOperator}
                onChange={setCreateOperator}
                options={operators}
                placeholder="Nombre del operador"
                createLabel="operador"
                nearMatchQuestion=" es la misma persona?"
              />
            </div>
          </div>
          {createError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
              {createError}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="h-9 flex-1" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button type="button" size="sm" className="h-9 flex-1" disabled={pending} onClick={submitCreate}>
              {pending ? 'Creando…' : 'Crear cliente'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
