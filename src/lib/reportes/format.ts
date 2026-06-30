// Helpers de formato compartidos por los componentes de reportes.

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const

export function periodLabel(year: number, month: number) {
  return `${MONTHS[month - 1]} ${year}`
}

// "hoy 14:32" / "ayer" / "24/06" según cuán reciente sea.
export function generatedAt(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) {
    return `hoy ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
  }
  const yest = new Date(now)
  yest.setDate(now.getDate() - 1)
  if (d.toDateString() === yest.toDateString()) return 'ayer'
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}
