'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { LuCircleAlert as CircleAlert, LuCircleCheck as CircleCheck, LuTrash2 as Trash2 } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ClientPicker } from './ClientPicker'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { ToastCard, TOAST_CARD_OPTIONS } from './ToastCard'
import {
  createAccountAction,
  deleteAccountAction,
  restoreAccountAction,
  updateAccountAction,
  type ActionError,
  type ExistingAccountInfo,
} from '@/app/actions/paid-media-actions'
import { formatThousandsInput, parseBudgetInput } from '@/lib/paid-media/format'
import type { AccountsWithReports } from '@/lib/paid-media/reports-presence'
import { PLATFORM_LABEL, PRIMARY_OBJECTIVE_OPTIONS, type AdAccountRow, type ClientOption, type Currency, type FundingMethodOption, type ManagementStatus, type Platform } from '@/lib/paid-media/types'

const UNSET = '__sin_definir__'

const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50'

// El formulario vive dentro de `SheetShell`, que es `z-[60]`. Radix portalea
// el desplegable a `document.body`, así que el z-index por defecto de
// `SelectContent` (`z-50`) lo dejaba DETRÁS del sheet: parecía que los
// desplegables no funcionaban cuando en realidad se estaban dibujando debajo.
// Mismo remedio que ya usa `ReportSheet` para sus Select/DropdownMenu.
const SELECT_CONTENT_CLASS = 'z-[70] border-accent'

// Meta ad account ids are `act_` + digits. The `act_` part is a fixed addon in
// the UI, so the field state holds digits only. A pasted `act_123` or Meta URL
// (`...?act=123&business_id=999`) keeps just the account digits: the `act`
// marker wins over any other number in the URL.
const META_PREFIX = 'act_'

function extractMetaDigits(raw: string): string {
  const marked = /act[=_](\d+)/i.exec(raw)
  return marked ? marked[1] : raw.replace(/\D/g, '')
}

// Coarse ActionError → field-level message. `management_status`/`id`/`client`
// map to the field whose constraint is realistically the cause (FK / PK / link);
// the rest stay a top-level banner since the DB error code alone cannot pin
// down a single free-text field.
const ERROR_MESSAGES: Record<ActionError, { field?: 'id' | 'management_status' | 'client'; message: string }> = {
  unauthorized: { message: 'No tenés permisos para hacer esta acción.' },
  duplicate_account: { field: 'id', message: 'Ya existe una cuenta con este ID.' },
  invalid_status: { field: 'management_status', message: 'El estado seleccionado no es válido.' },
  invalid_value: {
    message: 'Alguno de los valores ingresados no es válido (revisá plataforma, financiamiento o presupuesto).',
  },
  not_found: { message: 'La cuenta ya no existe o fue movida a la papelera.' },
  client_trashed: { field: 'client', message: 'Ese cliente está en la papelera. Restauralo primero o elegí otro.' },
  duplicate_client: { field: 'client', message: 'Ya existe un cliente con ese nombre.' },
  invalid_account_id: {
    field: 'id',
    message: 'El ID de una cuenta de Meta son solo números (se guarda con el prefijo act_).',
  },
  db_error: { message: 'Ocurrió un error inesperado. Probá de nuevo.' },
}

interface Props {
  mode: 'create' | 'edit'
  account?: AdAccountRow
  statuses: ManagementStatus[]
  fundingMethods: FundingMethodOption[]
  /** Active clients to pick from (full set, not the filtered list). */
  clients: ClientOption[]
  /** Valores distintos del dataset completo (sin filtrar), para autocompletar. */
  pmNames: string[]
  operators: string[]
  /** Create mode: preselect this client (opened from a client's detail). */
  defaultClientId?: string | null
  /**
   * Optional, removable layer — see `reports-presence.ts`. Only consulted in
   * edit mode, to select the confirm modal's copy branch.
   */
  accountsWithReports?: AccountsWithReports
  onSaved: () => void
  onCancel: () => void
  /** Edit mode only: called after a successful delete so the caller can close the sheet. */
  onDeleted?: () => void
}

// Budget/note are one text field on screen (design: numeric text writes
// `monthly_budget`, non-numeric text writes `monthly_budget_note`), so the
// initial value is whichever of the two the account already has.
function initialBudgetInput(account: AdAccountRow | undefined): string {
  if (!account) return ''
  if (account.monthly_budget !== null) return formatThousandsInput(account.monthly_budget.toString())
  return account.monthly_budget_note ?? ''
}

export function AccountForm({
  mode,
  account,
  statuses,
  fundingMethods,
  clients,
  pmNames,
  operators,
  defaultClientId,
  accountsWithReports,
  onSaved,
  onCancel,
  onDeleted,
}: Props) {
  // Meta: digits only (the `act_` addon is rendered, not typed). Other
  // platforms: free text. Edit mode: the account's own id, never recomposed.
  const [id, setId] = useState(account?.platform === 'meta' ? extractMetaDigits(account.id) : (account?.id ?? ''))
  const [name, setName] = useState(account?.name ?? '')
  const [platform, setPlatform] = useState<Platform>(account?.platform ?? 'meta')
  const [clientId, setClientId] = useState<string | null>(account ? account.client_id : (defaultClientId ?? null))
  const [clientUncommitted, setClientUncommitted] = useState(false)
  const [clientBlocked, setClientBlocked] = useState(false)
  const [managementStatus, setManagementStatus] = useState(account?.management_status ?? '')
  const [fundingMethod, setFundingMethod] = useState(account?.funding_method ?? '')
  const [geo, setGeo] = useState(account?.geo ?? '')
  const [strategyUrl, setStrategyUrl] = useState(account?.strategy_url ?? '')
  const [notes, setNotes] = useState(account?.notes ?? '')
  const [budgetInput, setBudgetInput] = useState(initialBudgetInput(account))
  const [currency, setCurrency] = useState<Currency>(account?.currency ?? 'ARS')
  const [primaryActionType, setPrimaryActionType] = useState(account?.primary_action_type ?? '')

  const [error, setError] = useState<ActionError | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  // Stable identity: the picker calls this from an effect keyed on it.
  const handleUncommittedChange = useCallback((uncommitted: boolean) => {
    setClientUncommitted(uncommitted)
    if (!uncommitted) setClientBlocked(false)
  }, [])

  const isMetaId = (mode === 'edit' && account ? account.platform : platform) === 'meta'
  // What is saved: edit never changes the PK; create composes the prefix.
  const accountId = mode === 'edit' && account ? account.id : isMetaId ? `${META_PREFIX}${id}` : id.trim()

  const errorInfo = error ? ERROR_MESSAGES[error] : null
  const idError = errorInfo?.field === 'id' ? errorInfo.message : null
  const clientError = clientBlocked
    ? 'Elegí un cliente de la lista o creá uno nuevo: el texto escrito todavía no es un cliente.'
    : errorInfo?.field === 'client'
      ? errorInfo.message
      : null
  const statusError = errorInfo?.field === 'management_status' ? errorInfo.message : null
  const bannerError = errorInfo && !errorInfo.field ? errorInfo.message : null

  // Selects copy only (Spec: "Reports Flag Is an Isolated, Removable Layer");
  // it never gates the delete button, the confirm flow, or the action call.
  const hasReports = account ? (accountsWithReports?.has(account.id) ?? false) : false

  function handleDelete() {
    if (!account) return
    setError(null)

    startTransition(async () => {
      const result = await deleteAccountAction(account.id)

      if (!result.success) {
        setShowConfirmDelete(false)
        setError(result.error ?? 'db_error')
        return
      }

      setShowConfirmDelete(false)
      toast(
        ({ closeToast }) => (
          <ToastCard
            tone="neutral"
            icon={<Trash2 className="size-5" />}
            title={`${account.name} se movió a la papelera`}
            body="Se eliminará definitivamente en 45 días. Podés restaurarla desde la papelera."
            actionLabel="Deshacer"
            onAction={() => {
              restoreAccountAction(account.id)
              closeToast()
            }}
            onClose={closeToast}
          />
        ),
        // Reemplaza `toast.info`/`toast.error` (forma de string plano, usada
        // en el resto de la app): la acción "Deshacer" necesita `closeToast`
        // para cerrarse a sí misma, así que esto pasa a la forma render-prop.
        // Las opciones (8s, sin chrome de la librería) viven en `ToastCard`.
        TOAST_CARD_OPTIONS,
      )
      onDeleted?.()
    })
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!id.trim() || !name.trim()) return
    // Typed-but-uncommitted client text would otherwise be saved as "no client".
    if (clientUncommitted) {
      setClientBlocked(true)
      return
    }
    setError(null)

    const { monthly_budget, monthly_budget_note } = parseBudgetInput(budgetInput)

    const input = {
      id: accountId,
      name: name.trim(),
      platform,
      client_id: clientId,
      management_status: managementStatus || null,
      funding_method: fundingMethod || null,
      geo: geo.trim() || null,
      strategy_url: strategyUrl.trim() || null,
      notes: notes.trim() || null,
      monthly_budget,
      monthly_budget_note,
      currency,
      primary_action_type: primaryActionType || null,
    }

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createAccountAction(input)
          : await updateAccountAction(input.id, input)

      if (!result.success) {
        if (result.error === 'duplicate_account' && result.existingAccount) {
          showDuplicateToast(result.existingAccount)
          return
        }
        setError(result.error ?? 'db_error')
        return
      }

      // El sheet se cierra al guardar, así que sin esto el único acuse de
      // recibo es que la fila cambia — y si el campo editado no se muestra en
      // la tabla (el objetivo principal, por ejemplo) no cambia nada visible y
      // parece que no guardó. El nombre va en el título porque desde el detalle
      // de un cliente con varias cuentas hay que saber CUÁL se guardó.
      toast(
        ({ closeToast }) => (
          <ToastCard
            tone="success"
            icon={<CircleCheck className="size-5" />}
            title={
              mode === 'create'
                ? `${input.name} se agregó a la lista`
                : `Cambios guardados en ${input.name}`
            }
            onClose={closeToast}
          />
        ),
        // Sin acción ni nada que leer con calma: 4s alcanzan y no tapan la
        // pantalla. `TOAST_CARD_OPTIONS` da 8s porque su toast lleva "Deshacer".
        { ...TOAST_CARD_OPTIONS, autoClose: 4000 },
      )
      onSaved()
    })
  }

  /**
   * El `act_` es la PK, así que "ya existe activa" y "está en la papelera"
   * llegan como el MISMO `23505`. Sin separarlas, el usuario recibe un error
   * sobre una fila que no puede ver en ninguna pantalla.
   *
   * Va por toast y NO por el error inline del campo: el toast es el que puede
   * llevar el botón a la papelera, y duplicar el aviso en los dos lados es
   * justo lo que `ReportesView` ya decidió no hacer para los finales de
   * generación. Cuando el lookup no devuelve fila (`existingAccount` ausente)
   * se cae al error inline de siempre, que sigue siendo correcto.
   */
  function showDuplicateToast(existing: ExistingAccountInfo) {
    const inTrash = existing.deletedAt !== null

    toast(
      ({ closeToast }) => (
        <ToastCard
          tone="danger"
          icon={<CircleAlert className="size-5" />}
          title="Esa cuenta ya existe"
          body={
            inTrash
              ? `${accountId} pertenece a ${existing.name}, que está en la papelera. Si es la cuenta que querías cargar, podés restaurarla desde ahí.`
              : `${accountId} ya está cargada como ${existing.name}.`
          }
          actionLabel={inTrash ? 'Ir a la papelera' : undefined}
          onAction={
            inTrash
              ? () => {
                  router.push('/dashboard/paid-media/clientes/papelera')
                  closeToast()
                }
              : undefined
          }
          onClose={closeToast}
        />
      ),
      TOAST_CARD_OPTIONS,
    )
  }

  return (
    <>
    <form onSubmit={submit} className="space-y-4 px-5 py-4">
      {bannerError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2.5 text-[12px] text-destructive">{bannerError}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Plataforma va antes del ID: el prefijo `act_` depende de ella. */}
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Plataforma
          </label>
          <Select
            value={platform}
            onValueChange={(v) => {
              setPlatform(v as Platform)
              // Entering Meta: keep only the digits of whatever was typed.
              if (v === 'meta') setId(extractMetaDigits(id))
            }}
          >
            <SelectTrigger data-autofocus={mode === 'edit' ? true : undefined} className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={SELECT_CONTENT_CLASS}>
              {(Object.keys(PLATFORM_LABEL) as Platform[]).map((p) => (
                <SelectItem key={p} value={p} className="focus:bg-secondary transition-colors ease-in duration-75">
                  {PLATFORM_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label
            htmlFor="account-id"
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            ID de cuenta <span aria-hidden="true" className="text-destructive text-xs font-bold">*</span>
          </label>
          {/* Input-group: el addon fijo y el input comparten borde, altura y
              anillo de foco (`focus-within`), así que se lee como un solo control. */}
          <div
            className={
              isMetaId
                ? 'flex h-10 w-full items-stretch overflow-hidden rounded-lg border border-border bg-background transition-colors focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15 has-disabled:opacity-50'
                : undefined
            }
          >
            {isMetaId && (
              <span
                aria-hidden="true"
                className="flex select-none items-center border-r border-border bg-muted/50 px-3 text-sm text-muted-foreground"
              >
                {META_PREFIX}
              </span>
            )}
            <input
              id="account-id"
              data-autofocus={mode === 'create' ? true : undefined}
              value={id}
              onChange={(e) => setId(isMetaId ? extractMetaDigits(e.target.value) : e.target.value)}
              disabled={mode === 'edit'}
              required
              inputMode={isMetaId ? 'numeric' : undefined}
              autoComplete="off"
              placeholder={isMetaId ? '123456789' : 'ID de la cuenta'}
              className={
                isMetaId
                  ? 'min-w-0 flex-1 bg-transparent px-3 text-sm outline-none disabled:cursor-not-allowed'
                  : INPUT_CLASS
              }
            />
          </div>
          {idError && <p className="mt-1 text-[11px] text-destructive">{idError}</p>}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Nombre de la cuenta <span aria-hidden="true" className="text-destructive text-xs font-bold">*</span>
        </label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className={INPUT_CLASS} />
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Cliente
        </label>
        <ClientPicker
          clients={clients}
          value={clientId}
          onChange={setClientId}
          onUncommittedChange={handleUncommittedChange}
          pmNames={pmNames}
          operators={operators}
        />
        {clientError && <p className="mt-1 text-[11px] text-destructive">{clientError}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Estado
          </label>
          <Select
            value={managementStatus || UNSET}
            onValueChange={(v) => setManagementStatus(v === UNSET ? '' : v)}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={SELECT_CONTENT_CLASS}>
              <SelectItem value={UNSET} className="focus:bg-secondary transition-colors ease-in duration-75">Sin estado</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s.key} value={s.key} className="focus:bg-secondary transition-colors ease-in duration-75">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {statusError && <p className="mt-1 text-[11px] text-destructive">{statusError}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Financiamiento
          </label>
          <Select
            value={fundingMethod || UNSET}
            onValueChange={(v) => setFundingMethod(v === UNSET ? '' : v)}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={SELECT_CONTENT_CLASS}>
              <SelectItem value={UNSET} className="focus:bg-secondary transition-colors ease-in duration-75">Sin definir</SelectItem>
              {fundingMethods.map((f) => (
                <SelectItem key={f.key} value={f.key} className="focus:bg-secondary transition-colors ease-in duration-75">
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Geo
          </label>
          <input value={geo} onChange={(e) => setGeo(e.target.value)} className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Moneda
          </label>
          <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={SELECT_CONTENT_CLASS}>
              <SelectItem value="ARS" className="focus:bg-secondary transition-colors ease-in duration-75">ARS</SelectItem>
              <SelectItem value="USD" className="focus:bg-secondary transition-colors ease-in duration-75">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Presupuesto mensual
          </label>
          <input
            value={budgetInput}
            onChange={(e) => setBudgetInput(formatThousandsInput(e.target.value))}
            // El placeholder largo ya no entra a media fila; el detalle de que
            // acepta texto libre sigue estando en el `title`.
            placeholder="1.200 o texto libre"
            title="Un número escribe el presupuesto; cualquier otro texto se guarda como nota (ej. Sin definir)."
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Objetivo principal
          </label>
          <Select
            value={primaryActionType || UNSET}
            onValueChange={(v) => setPrimaryActionType(v === UNSET ? '' : v)}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={SELECT_CONTENT_CLASS}>
              <SelectItem value={UNSET} className="focus:bg-secondary transition-colors ease-in duration-75">
                Detectar automáticamente
              </SelectItem>
              {PRIMARY_OBJECTIVE_OPTIONS.map((o) => (
                <SelectItem key={o.key} value={o.key} className="focus:bg-secondary transition-colors ease-in duration-75">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Fija la conversión que mide el reporte. Sin elegir, se deduce de las campañas.
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          URL de estrategia
        </label>
        <input value={strategyUrl} onChange={(e) => setStrategyUrl(e.target.value)} className={INPUT_CLASS} />
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Notas
        </label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      {mode === 'edit' && (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            // Los `dark:hover:*` NO son decorativos ni redundantes. `cn` es
            // `twMerge`, que agrupa los conflictos por cadena de modificadores:
            // `hover:bg-destructive/10` pisa al `hover:bg-primary/5` de la
            // variante `outline`, pero su `dark:hover:bg-primary/15` es otra
            // clave y sobrevive intacto. En oscuro matchean los dos y gana el
            // `dark:` por orden en el CSS, así que sin estas dos clases el
            // hover se ve violeta en oscuro y rojo en claro. Lo mismo con el
            // borde. Si algún día se tocan los hovers de `outline`, revisar acá.
            className="h-9 gap-1.5 border-destructive/30 text-destructive hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive dark:hover:border-destructive/50 dark:hover:bg-destructive/10"
            onClick={() => setShowConfirmDelete(true)}
          >
            <Trash2 className="size-3.5" /> Eliminar cuenta
          </Button>
        </div>
      )}

      <div className="flex gap-2.5 pt-1">
        <Button type="button" variant="outline" className="h-10 flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending} className="h-10 flex-1">
          {pending ? 'Guardando…' : mode === 'create' ? 'Crear cuenta' : 'Guardar cambios'}
        </Button>
      </div>
    </form>

    {mode === 'edit' && account && showConfirmDelete && (
      <ConfirmDeleteModal
        accountName={account.name}
        hasReports={hasReports}
        pending={pending}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
    )}
    </>
  )
}
