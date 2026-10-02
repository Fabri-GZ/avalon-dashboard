'use client'

import { useState, useTransition } from 'react'
import { toast } from 'react-toastify'
import { LuCircleCheck as CircleCheck } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClientAction, updateClientAction, type ActionError, type ExistingClientInfo } from '@/app/actions/paid-media-actions'
import type { ClientGroup, ClientStatus } from '@/lib/paid-media/types'
import { normalizePersonName } from '@/lib/paid-media/names'
import { normalizeWebsiteUrl } from '@/lib/paid-media/url'
import { createErrorMessage } from './ClientPicker'
import { NameCombobox } from './NameCombobox'
import { ToastCard, TOAST_CARD_OPTIONS } from './ToastCard'

const UNSET = '__sin_definir__'

const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50'

const LABEL_CLASS = 'mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'

// Same stacking fix as `AccountForm`: the form lives inside the z-[60] sheet.
const SELECT_CONTENT_CLASS = 'z-[70] border-accent'

/** What the sheet needs to keep rendering the client before the refresh lands. */
export interface SavedClient {
  clientId: string
  clientName: string
  websiteUrl: string | null
  instagramUrl: string | null
  pmName: string | null
  operatorName: string | null
  status: string | null
}

interface Props {
  mode: 'create' | 'edit'
  /** Edit mode: the client being edited. */
  client?: ClientGroup
  clientStatuses: ClientStatus[]
  /** Distinct values from the full dataset, for autocomplete. */
  pmNames: string[]
  operators: string[]
  onSaved: (saved: SavedClient) => void
  onCancel: () => void
}

const blankToNull = (s: string) => s.trim() || null

/**
 * Create / edit a client (the paid-media entity: name, web, IG, PM, operator,
 * status). Portal clients keep an admin-only name — the DB guard trigger would
 * reject a rename, so the field is disabled and the name is never sent.
 */
export function ClientForm({ mode, client, clientStatuses, pmNames, operators, onSaved, onCancel }: Props) {
  const [name, setName] = useState(client?.clientName ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(client?.websiteUrl ?? '')
  const [instagramUrl, setInstagramUrl] = useState(client?.instagramUrl ?? '')
  const [pmName, setPmName] = useState(client?.pmName ?? '')
  const [operatorName, setOperatorName] = useState(client?.operatorName ?? '')
  const [status, setStatus] = useState(client?.status ?? '')

  const [error, setError] = useState<{
    code: ActionError
    existing?: ExistingClientInfo
    field?: 'website_url'
  } | null>(null)
  const [pending, startTransition] = useTransition()

  const nameLocked = mode === 'edit' && Boolean(client?.portalEnabled)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    setError(null)

    const fields = {
      website_url: blankToNull(websiteUrl),
      instagram_url: blankToNull(instagramUrl),
      pm_name: blankToNull(pmName),
      operator_name: blankToNull(operatorName),
      status: status || null,
    }

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createClientAction({ company_name: trimmedName, ...fields })
          : await updateClientAction(client!.clientId, {
              // Only a changed name is sent: web/IG edits on a portal client
              // must not trip the admin-only name guard.
              ...(!nameLocked && trimmedName !== client!.clientName && { company_name: trimmedName }),
              ...fields,
            })

      const clientId = mode === 'create' ? result.clientId : client!.clientId
      if (!result.success || !clientId) {
        setError({ code: result.error ?? 'db_error', existing: result.existingClient, field: result.field })
        return
      }

      const savedName = nameLocked ? client!.clientName : trimmedName
      toast(
        ({ closeToast }) => (
          <ToastCard
            tone="success"
            icon={<CircleCheck className="size-5" />}
            title={mode === 'create' ? `${savedName} se agregó como cliente` : `Cambios guardados en ${savedName}`}
            onClose={closeToast}
          />
        ),
        { ...TOAST_CARD_OPTIONS, autoClose: 4000 },
      )
      onSaved({
        clientId,
        clientName: savedName,
        // Mirror the server-side normalization (it already accepted this value).
        websiteUrl: normalizeWebsiteUrl(fields.website_url) ?? null,
        instagramUrl: fields.instagram_url,
        pmName: normalizePersonName(fields.pm_name),
        operatorName: normalizePersonName(fields.operator_name),
        status: fields.status,
      })
    })
  }

  // Name collisions get the rich message (papelera link); everything else is a
  // banner, with the portal-name guard (`unauthorized`) spelled out for edits.
  const nameError = error?.code === 'duplicate_client' ? createErrorMessage(error.code, error.existing) : null
  const websiteError =
    error?.code === 'invalid_value' && error.field === 'website_url'
      ? 'Ingresá una URL válida (http o https), por ejemplo www.ejemplo.com.'
      : null
  const bannerError = !error || nameError || websiteError
    ? null
    : error.code === 'unauthorized'
      ? mode === 'edit'
        ? 'No tenés permisos para editar este cliente. El nombre de los clientes del portal solo lo cambia un admin.'
        : 'No tenés permisos para crear clientes.'
      : error.code === 'invalid_status'
        ? 'El estado seleccionado no es válido.'
        : error.code === 'invalid_value'
          ? 'Revisá los valores ingresados: el nombre no puede estar vacío.'
          : error.code === 'not_found'
            ? 'El cliente ya no existe o fue movido a la papelera.'
            : 'Ocurrió un error inesperado. Probá de nuevo.'

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 px-5 py-4">
      {bannerError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2.5 text-[12px] text-destructive">{bannerError}</p>
      )}

      <div>
        <label htmlFor="client-name" className={LABEL_CLASS}>
          Nombre del cliente <span aria-hidden="true" className="text-destructive text-xs font-bold">*</span>
        </label>
        <input
          id="client-name"
          data-autofocus={mode === 'create' ? true : undefined}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={nameLocked}
          required
          autoComplete="off"
          aria-invalid={nameError ? true : undefined}
          className={INPUT_CLASS}
        />
        {nameLocked && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Cliente del portal: el nombre solo lo cambia un admin. Podés editar el resto de los datos.
          </p>
        )}
        {nameError && <p className="mt-1 text-[11px] text-destructive">{nameError}</p>}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="client-website" className={LABEL_CLASS}>Sitio web</label>
          <input
            id="client-website"
            data-autofocus={mode === 'edit' ? true : undefined}
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            autoComplete="off"
            aria-invalid={websiteError ? true : undefined}
            className={INPUT_CLASS}
          />
          {websiteError && <p className="mt-1 text-[11px] text-destructive">{websiteError}</p>}
        </div>
        <div>
          <label htmlFor="client-instagram" className={LABEL_CLASS}>Instagram</label>
          <input
            id="client-instagram"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            autoComplete="off"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLASS}>PM</label>
          <NameCombobox
            value={pmName}
            onChange={setPmName}
            options={pmNames}
            placeholder="Nombre del PM"
            createLabel="PM"
            nearMatchQuestion=" es la misma persona?"
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Operador</label>
          <NameCombobox
            value={operatorName}
            onChange={setOperatorName}
            options={operators}
            placeholder="Nombre del operador"
            createLabel="operador"
            nearMatchQuestion=" es la misma persona?"
          />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Estado</label>
        <Select value={status || UNSET} onValueChange={(v) => setStatus(v === UNSET ? '' : v)}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={SELECT_CONTENT_CLASS}>
            <SelectItem value={UNSET} className="focus:bg-secondary transition-colors ease-in duration-75">
              Sin estado
            </SelectItem>
            {clientStatuses.map((s) => (
              <SelectItem key={s.key} value={s.key} className="focus:bg-secondary transition-colors ease-in duration-75">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2.5 pt-1">
        <Button type="button" variant="outline" className="h-10 flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending} className="h-10 flex-1">
          {pending ? 'Guardando…' : mode === 'create' ? 'Crear cliente' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}
