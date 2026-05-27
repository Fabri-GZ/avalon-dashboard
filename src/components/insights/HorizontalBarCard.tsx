'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, LabelList, Cell,
  ResponsiveContainer,
} from 'recharts'
import type { DistributionSlice, FunnelStage } from '@/lib/insights/types'
import { tooltipStyle, axisTickStyle } from './chartTheme'

interface HorizontalBarCardProps {
  title: string
  data: DistributionSlice[] | FunnelStage[]
  colored?: boolean
}

function isFunnelStage(item: DistributionSlice | FunnelStage): item is FunnelStage {
  return 'color' in item
}

export function HorizontalBarCard({ title, data, colored = false }: HorizontalBarCardProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const isEmpty = data.length === 0

  const isFunnel = colored && data.length > 0 && isFunnelStage(data[0])
  const showTopN = isMobile && !isFunnel && data.length > 4
  const displayData = showTopN ? data.slice(0, 4) : data
  const hiddenCount = data.length - 4

  const chartHeight = Math.max(displayData.length * 44, 160)
  const yAxisWidth = isMobile ? 72 : 92

  const normalized = displayData.map((item) => ({
    label: isFunnelStage(item) ? item.label : (item as DistributionSlice).label,
    value: isFunnelStage(item) ? item.value : (item as DistributionSlice).value,
    color: isFunnelStage(item) ? item.color : undefined,
  }))

  return (
    <div className="bg-card rounded-xl border border-secondary p-5 sm:p-6 h-full">
      <div className="mb-4">
        <span className="text-base font-semibold text-foreground">{title}</span>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center h-[160px]">
          <span className="text-sm text-muted-foreground">Sin datos para este período</span>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              layout="vertical"
              data={normalized}
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={axisTickStyle}
                hide={isMobile}
              />
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={axisTickStyle}
                width={yAxisWidth}
                tickFormatter={(val: string) =>
                  isMobile && val.length > 12 ? `${val.slice(0, 12)}…` : val
                }
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value: number, name: string, props: { payload?: { label: string } }) => [
                  value,
                  props.payload?.label ?? name,
                ]}
              />
              <Bar dataKey="value" barSize={isMobile ? 16 : 20} radius={[0, 6, 6, 0]}>
                {colored
                  ? normalized.map((item, i) => (
                      <Cell key={i} fill={item.color ?? 'var(--chart-1)'} />
                    ))
                  : normalized.map((_, i) => (
                      <Cell key={i} fill="var(--chart-1)" />
                    ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  style={{ fill: 'var(--foreground)', fontSize: 12, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {showTopN && (
            <p className="text-xs text-muted-foreground mt-2">+{hiddenCount} más</p>
          )}
        </>
      )}
    </div>
  )
}
