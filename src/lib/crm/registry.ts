import type { IconType } from 'react-icons'
import {
  LuMapPin as MapPin,
  LuPackage as Package,
  LuLayers as Layers,
  LuGitBranch as GitBranch,
  LuUserCheck as UserCheck,
  LuBike as Bike,
  LuCreditCard as CreditCard,
  LuBuilding2 as Building2,
  LuGauge as Gauge,
  LuStickyNote as StickyNote,
  LuCalendarClock as CalendarClock,
} from 'react-icons/lu'
import { prettify, capitalize } from './format'
import type { Lead, LeadDetails } from './types'

// Per-client `details` vocabulary (design D2 / D1): the DB accepts any jsonb
// shape because the keys are emitted by each client's chatbot prompt in n8n
// and can change without a deploy. This registry is the ONLY place that
// interprets those keys. Everything here must be tolerant: an unknown
// `client_key` or an unexpected/missing field renders nothing, never throws.

export interface DetailFieldDescriptor {
  key: string
  label: string
  icon: IconType
  /** Reads `details[key]` (and the full `details` bag, for composite fields
   * that need a second key) and returns the display string, or `null` to
   * hide the field entirely. */
  format: (raw: unknown, details: LeadDetails) => string | null
  /** Extra gate beyond "value present" -- e.g. only show a derivation field
   * once the lead actually was derived. Receives the full lead because that
   * condition (`lead.derivado`) lives outside `details`. */
  showWhen?: (lead: Lead) => boolean
}

export interface BadgeDescriptor {
  key: string
  label: string
  className: string
}

export interface IntencionStyle {
  label: string
  className: string
}

// `null` means "this client deliberately hides the badge for that value". It is
// distinct from a missing key, which falls through to `SHARED_INTENCION_STYLE`.
// Used when a value is so common it carries no signal -- see the `viviera` entry.
type IntencionStyleMap = Record<string, IntencionStyle | null>

interface ClientRegistryEntry {
  fields: DetailFieldDescriptor[]
  badges: (details: LeadDetails) => BadgeDescriptor[]
  /** Optional per-client override for `intencion` labels/styles. Falls back
   * to `SHARED_INTENCION_STYLE` for keys not present here, then to a neutral
   * muted style showing the raw value. */
  intencion?: IntencionStyleMap
}

// Shared default `intencion` vocabulary across clients that don't define
// their own (Grupo Norte, Viviera). Moved here (verbatim) from
// `LeadBadges.tsx` so per-client overrides (e.g. FZ Motos) can layer on top
// without duplicating these three styles.
const SHARED_INTENCION_STYLE: IntencionStyleMap = {
  presupuesto: {
    label: 'Presupuesto',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  },
  postventa: {
    label: 'Postventa',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
  },
  otro: {
    label: 'Otro',
    className: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300',
  },
}

function asString(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed ? trimmed : null
}

function asPrettyString(raw: unknown): string | null {
  const value = asString(raw)
  return value ? prettify(value) : null
}

// Grupo Norte's `ubicacion` is specifically "<province_slug> - <locality>"
// (e.g. "buenos_aires - Benavidez"). This is NOT a shared format -- it's GN's
// vocabulary, so it stays in GN's registry entry rather than in `format.ts`.
const GN_PROVINCE: Record<string, string> = {
  buenos_aires: 'Buenos Aires',
  resto_pais: 'Resto del País',
}

function prettifyGnLocation(raw: unknown): string | null {
  const value = asString(raw)
  if (!value) return null
  const [prov, ...rest] = value.split(/\s*-\s*/)
  const provLabel = GN_PROVINCE[prov.trim().toLowerCase()] ?? prettify(prov)
  const loc = rest.join(' - ').trim()
  return loc ? `${provLabel} · ${prettify(loc)}` : provLabel
}

// Shared across GN and Viviera: both have a `tipo_derivacion` key and both
// only want to show it once the lead was actually derived, falling back to a
// plain "Derivado" label when the bot didn't capture a specific type.
function derivationField(): DetailFieldDescriptor {
  return {
    key: 'tipo_derivacion',
    label: 'Derivación',
    icon: GitBranch,
    format: (raw) => capitalize(asString(raw) ?? '') || 'Derivado',
    showWhen: (lead) => !!lead.derivado,
  }
}

const REGISTRY: Record<string, ClientRegistryEntry> = {
  'grupo-norte': {
    fields: [
      {
        key: 'ubicacion',
        label: 'Ubicación',
        icon: MapPin,
        format: (raw) => prettifyGnLocation(raw),
      },
      {
        key: 'material',
        label: 'Material',
        icon: Package,
        format: (raw) => asPrettyString(raw),
      },
      {
        key: 'cantidad_aberturas',
        label: 'Aberturas',
        icon: Layers,
        format: (raw) => asPrettyString(raw),
      },
      {
        key: 'detalle_aberturas',
        label: 'Detalle',
        icon: Layers,
        format: (raw) => asString(raw),
      },
      derivationField(),
      {
        key: 'comercial_asignado',
        label: 'Comercial',
        icon: UserCheck,
        format: (raw) => asString(raw),
      },
    ],
    // Grupo Norte has no client-specific badge today -- intención (shared,
    // rendered by LeadBadges regardless of client) is enough.
    badges: () => [],
  },

  'fz-motos': {
    fields: [
      {
        key: 'producto',
        label: 'Moto de interés',
        icon: Bike,
        format: (raw) => asPrettyString(raw),
      },
      {
        key: 'ubicacion',
        label: 'Ubicación',
        icon: MapPin,
        format: (raw) => asPrettyString(raw),
      },
      {
        key: 'sucursal',
        label: 'Sucursal',
        icon: Building2,
        format: (raw) => asPrettyString(raw),
      },
      {
        key: 'forma_pago',
        label: 'Forma de pago',
        icon: CreditCard,
        format: (raw) => asPrettyString(raw),
      },
      {
        key: 'tiene_usada',
        label: 'Usada como parte de pago',
        icon: Bike,
        format: (_raw, details) => {
          const modelo = asPrettyString(details.usada_modelo)
          const anio = asString(details.usada_anio)
          const parts = [modelo, anio].filter(Boolean).join(' ')
          return parts || 'Sí'
        },
        showWhen: (lead) => (lead.details as LeadDetails).tiene_usada === true,
      },
      {
        key: 'nivel_interes',
        label: 'Nivel de interés',
        icon: Gauge,
        format: (raw) => asPrettyString(raw),
      },
      {
        key: 'nota_comercial',
        label: 'Nota comercial',
        icon: StickyNote,
        format: (raw) => asString(raw),
      },
    ],
    intencion: {
      compra_bici: {
        label: 'Bici',
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
      },
      compra_moto: {
        label: 'Moto',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
      },
      accesorios: {
        label: 'Accesorios',
        className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300',
      },
      otro: {
        label: 'Otro',
        className: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300',
      },
    },
    badges: (details) => {
      const badges: BadgeDescriptor[] = []

      const matchStock = asString(details.match_stock)
      if (matchStock === 'sustituto') {
        badges.push({
          key: 'match_stock',
          label: 'Sustituto',
          className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
        })
      } else if (matchStock === 'sin_stock') {
        badges.push({
          key: 'match_stock',
          label: 'Sin stock',
          className: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300',
        })
      }

      return badges
    },
  },

  'viviera': {
    fields: [
      {
        key: 'reunion',
        label: 'Reunión',
        icon: CalendarClock,
        format: (raw) => asPrettyString(raw),
      },
      derivationField(),
    ],
    // Only `visita_proyecto` earns a badge. Anyone who writes to a real estate
    // chatbot wants an apartment, so `compra_depto` is the default and would sit
    // on nearly every card without saying anything -- the same trap FZ's
    // "En stock" badge fell into. Wanting to *visit* is the milestone: it marks
    // a lead that showed intent, which matters most when it then goes quiet
    // without ever being derived.
    intencion: {
      compra_depto: null,
      otro: null,
      visita_proyecto: {
        label: 'Visita',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
      },
    },
    badges: (details) => {
      const badges: BadgeDescriptor[] = []

      const proyecto = asString(details.proyecto)
      if (proyecto === 'novo' || proyecto === 'tower') {
        badges.push({
          key: 'proyecto',
          label: proyecto.toUpperCase(),
          className:
            proyecto === 'tower'
              ? 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
        })
      }

      // `interes` is stored as the bot emits it ("3 ambientes"); the card shows
      // the short form so three badges still fit on one line.
      const interes = asString(details.interes)
      if (interes) {
        badges.push({
          key: 'interes',
          label: interes.replace(/ambientes?/i, 'amb.'),
          className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300',
        })
      }

      return badges
    },
  },
}

export function getDetailFields(clientKey: string): DetailFieldDescriptor[] {
  return REGISTRY[clientKey]?.fields ?? []
}

export function getClientBadges(clientKey: string, details: LeadDetails): BadgeDescriptor[] {
  return REGISTRY[clientKey]?.badges(details) ?? []
}

export function getIntencionBadge(clientKey: string, intencion: string | null): IntencionStyle | null {
  if (!intencion) return null
  // Key presence, not truthiness: a client maps a value to `null` to hide it, and
  // `??` would send that straight to the shared map and render it anyway.
  const perClient = REGISTRY[clientKey]?.intencion
  if (perClient && intencion in perClient) return perClient[intencion]
  const shared = SHARED_INTENCION_STYLE[intencion]
  if (shared) return shared
  return { label: intencion, className: 'bg-muted text-muted-foreground' }
}
