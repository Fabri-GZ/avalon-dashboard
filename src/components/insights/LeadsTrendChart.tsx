'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TimeSeriesPoint } from '@/lib/insights/types'
import { tooltipStyle, axisTickStyle } from './chartTheme'

interface LeadsTrendChartProps {
  data: TimeSeriesPoint[]
}

const isEmpty = (data: TimeSeriesPoint[]) =>
  data.length === 0 || data.every((p) => p.value === 0)

export function LeadsTrendChart({ data }: LeadsTrendChartProps) {
  const empty = isEmpty(data)

  return (
    <div className="bg-card rounded-xl border border-secondary p-5 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-base font-semibold text-foreground">Evolución de leads</span>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="leadsTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="var(--secondary)"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={axisTickStyle}
              minTickGap={20}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={axisTickStyle}
              width={32}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(value: number) => [`${value} leads`, 'Leads']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#leadsTrendFill)"
              dot={false}
              activeDot={{ r: 4, fill: 'var(--chart-1)', stroke: 'var(--card)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {empty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm text-muted-foreground bg-card/80 px-3 py-1 rounded-md">
              Sin leads en este período
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
