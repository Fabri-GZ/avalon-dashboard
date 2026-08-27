'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { LuCircleAlert as CircleAlert, LuTrash2 as Trash2 } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ClientNameCombobox } from './ClientNameCombobox'
import { NameCombobox } from './NameCombobox'
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
import { parseBudgetInput } from '@/lib/paid-media/format'
import type { AccountsWithReports } from '@/lib/paid-media/reports-presence'
import { PLATFORM_LABEL, type AdAccountRow, type Currency, type FundingMethodOption, type ManagementStatus, type Platform } from '@/lib/paid-media/types'

const UNSET = '__sin_definir__'

const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50'

// El formulario vive dentro de `SheetShell`, que es `z-[60]`. Radix portalea
// el desplegable a `document.body`, así que el z-index por defecto de
// `SelectContent` (`z-50`) lo dejaba DETRÁS del sheet: parecía que los
// desplegables no funcionaban cuando en realidad se estaban dibujando debajo.
// Mismo remedio que ya usa `ReportSheet` para sus Select/DropdownMenu.
const SELECT_CONTENT_CLASS = 'z-[70] border-accent'

// Coarse ActionError → field-level message. `management_status`/`id` map to
// the field whose constraint is realistically the cause (FK / PK); the rest
// stay a top-level banner since the DB error code alone cannot pin down a
// single free-text field.
const ERROR_MESSAGES: Record<ActionError, { field?: 'id' | 'management_status'; message: string }> = {
  unauthorized: { message: 'No tenés permisos para hacer esta acción.' },
  duplicate_account: { field: 'id', message: 'Ya existe una cuenta con este ID.' },
  invalid_status: { field: 'management_status', message: 'El estado seleccionado no es válido.' },
  invalid_value: {
    message: 'Alguno de los valores ingresados no es válido (revisá plataforma, financiamiento o presupuesto).',
  },
  not_found: { message: 'La cuenta ya no existe o fue movida a la papelera.' },
  db_error: { message: 'Ocurrió un error inesperado. Probá de nuevo.' },
}

interface Props {
  mode: 'create' | 'edit'
  account?: AdAccountRow
  statuses: ManagementStatus[]
  fundingMethods: FundingMethodOption[]
  existingClientNames: string[]
  /** Valores distintos del dataset completo (sin filtrar), para autocompletar. */
  pmNames: string[]
  operators: string[]
  defaultClientName?: string
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
  if (account.monthly_budget !== null) return account.monthly_budget.toString()
  return account.monthly_budget_note ?? ''
}

export function AccountForm({
  mode,
  account,
  statuses,
  fundingMethods,
  existingClientNames,
  pmNames,
  operators,
  defaultClientName,
  accountsWithReports,
  onSaved,
  onCancel,
  onDeleted,
}: Props) {
  const [id, setId] = useState(account?.id ?? '')
  const [name, setName] = useState(account?.name ?? '')
  const [platform, setPlatform] = useState<Platform>(account?.platform ?? 'meta')
  const [clientName, setClientName] = useState(account?.client_name ?? defaultClientName ?? '')
  const [managementStatus, setManagementStatus] = useState(account?.management_status ?? '')
  const [fundingMethod, setFundingMethod] = useState(account?.funding_method ?? '')
  const [pmName, setPmName] = useState(account?.pm_name ?? '')
  const [operatorName, setOperatorName] = useState(account?.operator_name ?? '')
  const [geo, setGeo] = useState(account?.geo ?? '')
  const [strategyUrl, setStrategyUrl] = useState(account?.strategy_url ?? '')
  const [notes, setNotes] = useState(account?.notes ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(account?.website_url ?? '')
  const [instagramUrl, setInstagramUrl] = useState(account?.instagram_url ?? '')
  const [budgetInput, setBudgetInput] = useState(initialBudgetInput(account))
  const [currency, setCurrency] = useState<Currency>(account?.currency ?? 'ARS')

  const [error, setError] = useState<ActionError | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const errorInfo = error ? ERROR_MESSAGES[error] : null
  const idError = errorInfo?.field === 'id' ? errorInfo.message : null
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
    setError(null)

    const { monthly_budget, monthly_budget_note } = parseBudgetInput(budgetInput)

    const input = {
      id: id.trim(),
      name: name.trim(),
      platform,
      client_name: clientName.trim() || null,
      management_status: managementStatus || null,
      funding_method: fundingMethod || null,
      pm_name: pmName.trim() || null,
      operator_name: operatorName.trim() || null,
      geo: geo.trim() || null,
      strategy_url: strategyUrl.trim() || null,
      notes: notes.trim() || null,
      website_url: websiteUrl.trim() || null,
      instagram_url: instagramUrl.trim() || null,
      monthly_budget,
      monthly_budget_note,
      currency,
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
              ? `${id.trim()} pertenece a ${existing.name}, que está en la papelera. Si es la cuenta que querías cargar, podés restaurarla desde ahí.`
              : `${id.trim()} ya está cargada como ${existing.name}.`
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
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            ID de cuenta <span aria-hidden="true" className="text-destructive text-xs font-bold">*</span>
          </label>
          <input
            data-autofocus={mode === 'create' ? true : undefined}
            value={id}
            onChange={(e) => setId(e.target.value)}
            disabled={mode === 'edit'}
            required
            placeholder="act_123456789"
            className={INPUT_CLASS}
          />
          {idError && <p className="mt-1 text-[11px] text-destructive">{idError}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Plataforma
          </label>
          <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
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
        <ClientNameCombobox value={clientName} onChange={setClientName} existingNames={existingClientNames} />
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
            PM
          </label>
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
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Operador
          </label>
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

      <div>
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Presupuesto mensual
        </label>
        <input
          value={budgetInput}
          onChange={(e) => setBudgetInput(e.target.value)}
          placeholder="1200 o una nota libre (ej. Sin definir)"
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          URL de estrategia
        </label>
        <input value={strategyUrl} onChange={(e) => setStrategyUrl(e.target.value)} className={INPUT_CLASS} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sitio web
          </label>
          <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Instagram
          </label>
          <input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className={INPUT_CLASS} />
        </div>
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
