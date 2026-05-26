export function relativeTime(iso: string | null): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'

  const diff = Date.now() - then
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`

  const hours = Math.floor(min / 60)
  if (hours < 24) return `hace ${hours} h`

  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days} d`

  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `hace ${weeks} sem`

  const months = Math.floor(days / 30)
  if (months < 12) return `hace ${months} mes${months > 1 ? 'es' : ''}`

  const years = Math.floor(days / 365)
  return `hace ${years} año${years > 1 ? 's' : ''}`
}

export function initials(nombre: string | null): string {
  const name = nombre?.trim()
  if (!name) return '?'
  const words = name.split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

const ACRONYMS: Record<string, string> = {
  pvc: 'PVC',
  caba: 'CABA',
  dvh: 'DVH',
  abs: 'ABS',
}

function capWord(word: string): string {
  if (!word) return word
  const lower = word.toLowerCase()
  if (ACRONYMS[lower]) return ACRONYMS[lower]
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

// Title-cases a free-text value while preserving "-", "/" and "," separators
// and uppercasing known acronyms (PVC, CABA…). e.g. "pvc / aluminio" → "PVC / Aluminio".
export function prettify(value: string | null): string {
  if (!value) return ''
  return value
    .replace(/_/g, ' ')
    .split(/(\s*[-/,]\s*|\s+)/)
    .map((tok) => (/[-/,]/.test(tok) || /^\s+$/.test(tok) ? tok : capWord(tok)))
    .join('')
    .trim()
}

export function capitalize(value: string | null): string {
  if (!value) return ''
  const t = value.trim()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

const PROVINCE: Record<string, string> = {
  buenos_aires: 'Buenos Aires',
  resto_pais: 'Resto del País',
}

// "buenos_aires - Benavidez" → "Buenos Aires · Benavidez"
export function prettifyLocation(value: string | null): string {
  if (!value) return ''
  const [prov, ...rest] = value.split(/\s*-\s*/)
  const provLabel = PROVINCE[prov.trim().toLowerCase()] ?? prettify(prov)
  const loc = rest.join(' - ').trim()
  return loc ? `${provLabel} · ${prettify(loc)}` : provLabel
}

// Bot messages arrive clean; user messages arrive as
// "Mensaje: <texto>\nFecha actual: <iso>" and may wrap <Image>/<Caption> tags.
export function cleanMessage(content: string | null): string {
  let text = content ?? ''
  text = text.replace(/\n?\s*Fecha actual:[\s\S]*$/i, '')
  text = text.replace(/^\s*Mensaje:\s*/i, '')
  text = text.replace(/<Image>([\s\S]*?)<\/Image>/gi, '$1')
  text = text.replace(/<Caption>([\s\S]*?)<\/Caption>/gi, (_m, c) => (c.trim() ? c : ''))
  return text.trim()
}
