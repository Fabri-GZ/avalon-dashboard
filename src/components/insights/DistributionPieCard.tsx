'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'
import type { DistributionSlice } from '@/lib/insights/types'
import { chartColors } from './chartTheme'

interface DistributionPieCardProps {
  title: string
  data: DistributionSlice[]
  colorVar?: string
}

export function DistributionPieCard({ title, data }: DistributionPieCardProps) {
  const isEmpty = data.length === 0
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="bg-card rounded-xl border border-secondary p-5 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-base font-semibold text-foreground">{title}</span>
        {!isEmpty && (
          <span className="text-xs text-muted-foreground tabular-nums">{total} leads</span>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-[240px] gap-2">
          <PieIcon size={32} className="text-muted-foreground/40" />
          <span className="text-sm text-muted-foreground">Sin datos para este período</span>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_auto] gap-4 items-center max-sm:grid-cols-1">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={48}
                outerRadius={80}
                cornerRadius={3}
                paddingAngle={2}
                stroke="var(--card)"
                strokeWidth={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={chartColors[i % chartColors.length]} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    const vb = viewBox as { cx?: number; cy?: number } | undefined
                    if (!vb?.cx || !vb?.cy) return null
                    const { cx, cy } = vb
                    return (
                      <g>
                        <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--foreground)" fontSize={18} fontWeight={700}>
                          {total}
                        </text>
                        <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--muted-foreground)" fontSize={11}>
                          leads
                        </text>
                      </g>
                    )
                  }}
                  position="center"
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="flex flex-col gap-2 max-sm:flex-row max-sm:flex-wrap max-sm:justify-center max-sm:gap-x-4 max-sm:gap-y-1">
            {data.map((slice, i) => (
              <div key={slice.label} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: chartColors[i % chartColors.length] }}
                />
                <span className="text-xs text-foreground">{slice.label}</span>
                <span className="text-xs font-semibold text-muted-foreground tabular-nums">{slice.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
