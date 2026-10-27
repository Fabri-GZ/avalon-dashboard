'use client'

import { useState } from 'react'
import { LuPlus, LuX } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { MAX_CC_EMAILS, addEmails } from '@/lib/paid-media/emails'

const INPUT_CLASS =
  'h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50'

const HOVER_PRIMARY = 'hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/15'

// Matches the separators `splitEmailList` understands.
const SEPARATOR_RE = /[\s,;]/

interface Props {
  id: string
  /** Added addresses (chips). */
  value: string[]
  onChange: (next: string[]) => void
  /** Typed text not yet added. Controlled so the form can flush it on submit. */
  draft: string
  onDraftChange: (next: string) => void
  /** Submit or server problem owned by the form; a local add notice wins. */
  error?: string | null
  placeholder?: string
}

type Notice = { tone: 'error' | 'info'; text: string }

const list = (emails: string[]) => emails.join(', ')

/**
 * Email list as removable chips: type an address and add it with the button,
 * Enter or a comma (a pasted list adds each one). Validation reuses the shared
 * recipient helpers, so the chips are exactly what the server will accept.
 */
export function EmailChipsInput({ id, value, onChange, draft, onDraftChange, error, placeholder }: Props) {
  const [notice, setNotice] = useState<Notice | null>(null)
  const full = value.length >= MAX_CC_EMAILS

  function add(raw: string) {
    if (!raw.trim()) return
    const result = addEmails(value, raw)
    if (result.list.length !== value.length) onChange(result.list)
    // Rejected text stays in the input so it can be fixed.
    onDraftChange(list([...result.invalid, ...result.overflow]))
    setNotice(
      result.invalid.length
        ? {
            tone: 'error',
            text:
              result.invalid.length === 1
                ? `Este email no es válido: ${result.invalid[0]}.`
                : `Estos emails no son válidos: ${list(result.invalid)}.`,
          }
        : result.overflow.length
          ? { tone: 'error', text: `Podés cargar hasta ${MAX_CC_EMAILS} emails en copia.` }
          : result.duplicates.length
            ? { tone: 'info', text: `Ya está en la lista: ${list(result.duplicates)}.` }
            : null,
    )
  }

  function remove(email: string) {
    onChange(value.filter((e) => e !== email))
    setNotice(null)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      // Enter must not submit the surrounding form.
      e.preventDefault()
      add(draft)
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      e.preventDefault()
      remove(value[value.length - 1])
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text')
    if (!SEPARATOR_RE.test(pasted.trim())) return
    e.preventDefault()
    add(`${draft} ${pasted}`)
  }

  const message = notice ?? (error ? { tone: 'error' as const, text: error } : null)

  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5" aria-label="Emails en copia">
          {value.map((email) => (
            <li
              key={email}
              className="flex max-w-full items-center gap-1 rounded-full border border-border bg-secondary py-0.5 pl-2.5 pr-0.5 text-[12px] text-foreground"
            >
              <span className="truncate">{email}</span>
              <button
                type="button"
                aria-label={`Quitar ${email}`}
                onClick={() => remove(email)}
                className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <LuX className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          id={id}
          // Text, not `email`: native validation would block submit before the
          // form can flush or report the draft.
          type="text"
          inputMode="email"
          value={draft}
          onChange={(e) => {
            onDraftChange(e.target.value)
            setNotice(null)
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          autoComplete="off"
          placeholder={full ? undefined : placeholder}
          aria-invalid={message?.tone === 'error' ? true : undefined}
          aria-describedby={`${id}-hint`}
          className={INPUT_CLASS}
        />
        <Button
          type="button"
          variant="outline"
          disabled={full || !draft.trim()}
          className={`h-10 shrink-0 text-foreground hover:border-primary/40 ${HOVER_PRIMARY}`}
          onClick={() => add(draft)}
        >
          <LuPlus /> Añadir correo
        </Button>
      </div>

      <p
        id={`${id}-hint`}
        aria-live="polite"
        className={`mt-1 text-[11px] ${message?.tone === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}
      >
        {message
          ? message.text
          : full
            ? `Llegaste al máximo de ${MAX_CC_EMAILS} emails en copia.`
            : `Opcional. Máximo ${MAX_CC_EMAILS}. También podés pegar varios juntos.`}
      </p>
    </div>
  )
}
