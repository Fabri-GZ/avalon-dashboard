import type { Variants } from 'framer-motion'
import {
  cardVariants as _cardVariants,
  containerVariants as _containerVariants,
} from '@/app/components/Dashboard/data/dataProcessors'

export const cardVariants = _cardVariants as Variants
export const containerVariants = _containerVariants as Variants

export const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'var(--background)',
    border: '1px solid var(--secondary)',
    borderRadius: '8px',
    fontSize: '12px',
  },
  // Sin `labelStyle` Recharts usa su default `#666`, pensado para fondo claro:
  // sobre `--background` en dark da ~2.4:1 y la etiqueta desaparece. El fondo
  // ya venía tematizado; el texto no. Se fijan los dos o ninguno.
  labelStyle: {
    color: 'var(--foreground)',
    fontWeight: 600,
    marginBottom: '2px',
  },
  itemStyle: {
    color: 'var(--muted-foreground)',
  },
}

export const axisTickStyle = {
  fill: 'var(--muted-foreground)',
  fontSize: 12,
}

export const gridStyle = {
  strokeDasharray: '3 3',
  stroke: 'var(--secondary)',
}

export const chartColors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]
